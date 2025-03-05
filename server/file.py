import os
import subprocess
import logging
import tempfile
import time
import re
import importlib
import sys
import shutil
from flask import Flask, request, jsonify, send_from_directory
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("manim_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY is required")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-thinking-exp-01-21')
review_model = genai.GenerativeModel('gemini-2.0-flash')  # Smaller model for code review

# Maximum number of retries for code generation
MAX_RETRIES = 5

def extract_python_code(response_text):
    """Extract Python code from Gemini API response."""
    # Look for code blocks with Python, python, py markers or without markers
    patterns = [
        r'```python\n(.*?)\n```',
        r'```py\n(.*?)\n```',
        r'```\n(.*?)\n```'
    ]

    for pattern in patterns:
        matches = re.findall(pattern, response_text, re.DOTALL)
        if matches:
            return matches[0]

    logger.warning("No code block found in the response, using full response")
    return response_text

def generate_manim_code(query, error_log=None):
    """Generate Manim code using Gemini API."""

    if error_log:
        prompt = f"""
        I previously asked you to create a Manim animation for this query:

        {query}

        But there was an error when executing the code. Here's the error log:

        {error_log}

        Please provide a fixed version of the Manim Python code that resolves these errors.
        Return only the executable Python code in a code block.
        """
    else:
        prompt = f"""
        Create a Manim animation (using Manim Community Edition) based on this query:

        {query}

        Follow this two-phase approach and guidelines:

        ## PHASE 1: SCENE PLANNING
        Before writing any animation code, plan the following scenes in detail:

        1. INTRO SCENE (5-8 seconds):
           - Include a clear title card presenting the main topic/question
           - Design an engaging visual introduction to the concept

        2. MAIN CONTENT SCENES (break into 3-5 logical sections):
           - Each scene should explore ONE specific aspect of the topic
           - Plan visual elements that best represent each concept
           - Allow sufficient time for each scene (10-30 seconds per concept)

        3. CONCLUSION SCENE (5-8 seconds):
           - Summarize key points
           - Create visual closure

        ## PHASE 2: ANIMATION IMPLEMENTATION

        ## Duration & Pacing
        - Create substantial animations (NOT just 1-second transitions)
        - Allow each animation to fully develop (3-5 seconds minimum)
        - Give viewers enough time to absorb complex visualizations
        - Use proper wait() calls between animation steps (1-3 seconds)
        - Include pauses after introducing new elements

        ## Text Placement & Formatting
        - Position text ONLY in the four corners of the screen
        - NEVER allow text elements to overlap each other
        - Top-left: Main titles/headings
        - Top-right: Secondary information/variables
        - Bottom-left: Explanatory notes
        - Bottom-right: Additional context/formulas
        - Use consistent font sizes appropriate for each text type

        ## Animation Guidelines
        - Use smooth transitions between elements (fade, slide, zoom)
        - Apply motion to emphasize key points
        - Implement reveal animations for lists and step-by-step content
        - Create meaningful animations that illustrate the concept (not just decorative)

        ## Visual Composition
        - Apply rule of thirds for main subject placement
        - Balance visual elements across the frame
        - Use color consistently to differentiate elements
        - Apply subtle highlights for emphasis
        - Ensure mathematical elements are properly sized and positioned

        Provide only the Python code to create this animation. The code should:
        1. Import the necessary modules
        2. Define a Scene class that inherits from Scene
        3. Include the construct method that implements the scene plan
        4. Create appropriate mathematical animations based on the query

        Return only the executable Python code in a code block.
        """

    logger.info(f"Sending prompt to Gemini API: {'with error log' if error_log else 'initial request'}")
    response = model.generate_content(prompt)

    # Extract the code from the response
    code = extract_python_code(response.text)
    logger.info("Received code from Gemini API")
    return code

def extract_packages_from_code(code):
    """Extract package names from import statements in the code."""
    import_patterns = [
        r'^import\s+([a-zA-Z0-9_\.]+)',  # import package
        r'^from\s+([a-zA-Z0-9_\.]+)\s+import',  # from package import ...
    ]

    packages = []
    for line in code.split('\n'):
        line = line.strip()
        for pattern in import_patterns:
            match = re.search(pattern, line)
            if match:
                package_name = match.group(1).split('.')[0]  # Extract base package name
                # Skip standard library packages and manim itself
                standard_libs = ['os', 'sys', 're', 'math', 'random', 'time', 'datetime',
                               'json', 'logging', 'manim', 'numpy', 'collections', 'itertools']
                if package_name not in standard_libs:
                    packages.append(package_name)

    return list(set(packages))  # Remove duplicates

def check_installed_packages(packages):
    """Check which packages from the list are not installed."""
    missing_packages = []
    for package in packages:
        try:
            importlib.import_module(package)
        except ImportError:
            missing_packages.append(package)

    return missing_packages

def install_missing_packages(packages):
    """Install missing packages using pip."""
    if not packages:
        return True, "No packages to install"

    logger.info(f"Installing missing packages: {', '.join(packages)}")

    cmd = f"{sys.executable} -m pip install {' '.join(packages)}"
    process = subprocess.Popen(
        cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()

    success = process.returncode == 0
    message = stdout.decode('utf-8') if success else stderr.decode('utf-8')

    if success:
        logger.info(f"Successfully installed packages: {', '.join(packages)}")
    else:
        logger.error(f"Failed to install packages: {message}")

    return success, message

def ensure_videos_directory():
    """Ensure the videos directory exists."""
    videos_dir = os.path.join(os.getcwd(), "videos")
    if not os.path.exists(videos_dir):
        os.makedirs(videos_dir)
        logger.info(f"Created videos directory at {videos_dir}")
    return videos_dir

@app.route('/videos/<path:filename>')
def serve_video(filename):
    """Serve video files from the videos directory."""
    videos_dir = ensure_videos_directory()
    return send_from_directory(videos_dir, filename)

def run_manim_code(code, filename=None):
    """Run the generated Manim code and return the result and any errors."""
    # Create videos directory if it doesn't exist
    videos_dir = ensure_videos_directory()

    # Format output filename
    output_filename = filename if filename else f"animation_{int(time.time())}"
    # Remove file extension if present
    output_filename = os.path.splitext(output_filename)[0]

    # Check for external packages in the code
    packages = extract_packages_from_code(code)
    installed_packages = []

    if packages:
        logger.info(f"External packages detected in code: {', '.join(packages)}")
        missing_packages = check_installed_packages(packages)

        if missing_packages:
            logger.info(f"Installing missing packages: {', '.join(missing_packages)}")
            success, message = install_missing_packages(missing_packages)
            if not success:
                return {
                    "success": False,
                    "stdout": "",
                    "stderr": f"Failed to install required packages: {message}",
                    "code": code,
                    "error_log_path": None,
                    "temp_dir": None,
                }
            installed_packages = missing_packages

    # Create a temporary directory for the manim files
    temp_dir = tempfile.mkdtemp()
    logger.info(f"Created temporary directory: {temp_dir}")

    # Create a python file with the generated code
    file_path = os.path.join(temp_dir, "manim_animation.py")
    with open(file_path, "w") as f:
        f.write(code)

    logger.info(f"Saved generated code to {file_path}")

    # Create a log file for errors
    error_log_path = os.path.join(temp_dir, "error.log")

    # Command to run the manim code with custom output filename
    cmd = f"cd {temp_dir} && python -m manim manim_animation.py Scene -qm -o {output_filename}"
    logger.info(f"Executing command: {cmd}")

    # Run the command and capture output
    process = subprocess.Popen(
        cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()

    stdout_text = stdout.decode('utf-8')
    stderr_text = stderr.decode('utf-8') if stderr else ""

    # Write any errors to the log file
    with open(error_log_path, "w") as f:
        if stderr:
            f.write(stderr_text)

    success = process.returncode == 0
    logger.info(f"Manim execution {'successful' if success else 'failed'}")

    result = {
        "success": success,
        "stdout": stdout_text,
        "stderr": stderr_text if stderr else None,
        "code": code,
        "error_log_path": error_log_path if not success else None,
        "temp_dir": temp_dir,
        "installed_packages": installed_packages
    }

    if success:
        # Try to extract the file path directly from stdout
        file_ready_pattern = r"File ready at\s+['\"](.*?)['\"]"
        file_matches = re.search(file_ready_pattern, stdout_text)

        if not file_matches:
            # Try with a more flexible pattern to handle multiline strings
            file_ready_pattern = r"File ready at\s+['\"]?(.*?\.mp4)['\"]?"
            file_matches = re.search(file_ready_pattern, stdout_text.replace('\n', ' '))

        if file_matches:
            temp_video_path = file_matches.group(1).strip()
            # Clean up the path (remove extra spaces, newlines, etc.)
            temp_video_path = re.sub(r'\s+', ' ', temp_video_path).strip()

            if os.path.exists(temp_video_path):
                # Copy the file to videos directory with the specified filename
                final_filename = f"{output_filename}.mp4"
                final_video_path = os.path.join(videos_dir, final_filename)
                shutil.copy2(temp_video_path, final_video_path)
                logger.info(f"Copied video to {final_video_path}")
                # Return both absolute and relative paths
                result["video_path"] = final_video_path
                result["relative_video_path"] = f"/videos/{final_filename}"  # Updated URL path
            else:
                logger.warning(f"Extracted path does not exist: {temp_video_path}")

        # Fallback: Find the generated video file by walking the directory
        if "video_path" not in result:
            logger.info("Falling back to directory walk to find video file")
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    if file.endswith(('.mp4', '.gif')):
                        temp_video_path = os.path.join(root, file)
                        final_filename = f"{output_filename}.mp4"
                        final_video_path = os.path.join(videos_dir, final_filename)
                        shutil.copy2(temp_video_path, final_video_path)
                        logger.info(f"Found video through directory walk and copied to {final_video_path}")
                        result["video_path"] = final_video_path
                        result["relative_video_path"] = f"/videos/{final_filename}"  # Updated URL path
                        break
                if "video_path" in result:
                    break

    return result

def check_text_overlap_issues(code):
    """
    Use a smaller model to check for text overlap issues and font size problems in the Manim code.
    Returns a tuple (has_issues, fixed_code, issues_found).
    """
    prompt = f"""
    You are a specialized code reviewer for Manim animations. Carefully analyze this code for potential text overlap issues or inappropriate text sizes:

    ```python
    {code}
    ```

    TASK: Identify and fix the following potential problems:

    1. TEXT OVERLAP ISSUES:
       - Look for multiple Text/MathTex/Tex objects positioned in the same area
       - Check if text objects are created and placed without removing previous ones
       - Verify that text in corners doesn't overlap due to size or position
       - Identify any cases where animations might cause text to pass over other text

    2. TEXT SIZE ISSUES:
       - Identify text that might be too large for the standard 1280x720 resolution
       - Look for font_size values that are extremely large (>= 72)
       - Check if MathTex/Tex objects have scale factors that make them too large
       - Text that is shown alongside detailed illustrations should not obscure the visual content

    If you find any issues:
    1. Provide a concise description of each problem
    2. Show the fixed code with proper text positioning and sizing
    3. Make sure no text objects overlap, especially in the corners
    4. Ensure text is properly removed (using FadeOut animations) before adding new text in the same area

    If no issues are found, respond with: "NO_ISSUES_FOUND"
    Otherwise, provide ONLY the complete fixed code with no explanations.
    """

    logger.info("Sending code to review model for text overlap check")
    try:
        response = review_model.generate_content(prompt)
        review_text = response.text.strip()

        if review_text == "NO_ISSUES_FOUND":
            logger.info("No text overlap or size issues found")
            return False, code, None
        else:
            # Extract code if it's wrapped in code blocks
            fixed_code = extract_python_code(review_text) or review_text
            logger.info("Potential text issues found and fixed")
            return True, fixed_code, review_text
    except Exception as e:
        logger.error(f"Error during text overlap check: {str(e)}")
        return False, code, None

@app.route('/query', methods=['POST'])
def process_query():
    """Process a query to generate and run Manim code."""
    data = request.json

    if not data or 'query' not in data:
        logger.error("No query provided")
        return jsonify({"error": "No query provided"}), 400

    query = data['query']
    filename = data.get('filename', None)

    logger.info(f"Received query: {query}")
    if filename:
        logger.info(f"Requested filename: {filename}")

    # Initial code generation
    code = generate_manim_code(query)

    # Try running the code, with retries for errors
    retry_count = 0
    overlap_retry_count = 0
    result = None
    MAX_OVERLAP_RETRIES = 3  # Maximum attempts to fix text overlap issues

    while retry_count < MAX_RETRIES:
        result = run_manim_code(code, filename)

        if result["success"]:
            logger.info("Manim code executed successfully")

            # Check for text overlap issues if the execution was successful
            has_overlap_issues, fixed_code, issues_found = check_text_overlap_issues(code)

            if has_overlap_issues and overlap_retry_count < MAX_OVERLAP_RETRIES:
                logger.info(f"Text overlap issues found (attempt {overlap_retry_count+1}/{MAX_OVERLAP_RETRIES})")
                code = fixed_code
                overlap_retry_count += 1
                # Retry with the fixed code
                continue
            else:
                # Either no issues or max overlap retries reached
                break

        retry_count += 1
        logger.warning(f"Execution failed (attempt {retry_count}/{MAX_RETRIES})")

        if retry_count >= MAX_RETRIES:
            logger.error(f"Max retries ({MAX_RETRIES}) reached, giving up")
            break

        # Read the error log
        error_log = None
        if result["error_log_path"] and os.path.exists(result["error_log_path"]):
            with open(result["error_log_path"], "r") as f:
                error_log = f.read()

        # Generate new code with the error log
        code = generate_manim_code(query, error_log)

    # Prepare response
    if result and result["success"]:
        response = {
            "status": "success",
            "message": "Manim animation generated successfully",
            "video_path": result.get("relative_video_path", "No video generated"),
            "video_url": request.host_url.rstrip('/') + result.get("relative_video_path", "") if "relative_video_path" in result else "",
            "absolute_path": result.get("video_path", ""),
            "stdout": result["stdout"],
            "overlap_fixes_attempted": overlap_retry_count,
            "installed_packages": result.get("installed_packages", [])
        }
    else:
        response = {
            "status": "error",
            "message": f"Failed to generate Manim animation after {retry_count} attempts",
            "error": result["stderr"] if result else "Unknown error",
            "last_code": code,
            "installed_packages": result.get("installed_packages", []) if result else []
        }

    return jsonify(response)

if __name__ == '__main__':
    # Check if Manim is installed
    try:
        subprocess.run(["manim", "--help"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info("Manim is installed and available")
    except FileNotFoundError:
        logger.error("Manim is not installed or not in PATH. Please install Manim Community Edition.")
        print("Error: Manim is not installed or not in PATH. Please install Manim Community Edition.")
        exit(1)

    app.run(debug=True)
