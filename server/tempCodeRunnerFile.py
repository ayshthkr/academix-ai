 try:
        subprocess.run(["manim", "--help"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info("Manim is installed and available")
    except FileNotFoundError:
        logger.error("Manim is not installed or not in PATH. Please install Manim Community Edition.")
        print("Error: Manim is not installed or not in PATH. Please install Manim Community Edition.")
        exit(1)