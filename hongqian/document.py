import os

def initialize_requirements_document(project_name, scope, objectives, features, constraints):
    # Create the requirements document
    filename = f"{project_name}_requirements.md"
    with open(filename, 'w') as file:
        file.write(f"# {project_name} Requirements Document\n\n")
        file.write("## Project Scope\n")
        file.write(f"{scope}\n\n")
        file.write("## Project Objectives\n")
        file.write(f"{objectives}\n\n")
        file.write("## Features\n")
        for feature in features:
            file.write(f"- {feature}\n")
        file.write("\n## Constraints\n")
        for constraint in constraints:
            file.write(f"- {constraint}\n")
    
    print(f"Requirements document '{filename}' has been created.")

# Example usage
project_name = "Sample Project"
scope = "This project aims to develop a web application for managing tasks."
objectives = "The main objectives are to provide a user-friendly interface, ensure data security, and support collaboration among users."
features = [
    "User authentication",
    "Task creation and management",
    "Real-time collaboration",
    "Notifications"
]
constraints = [
    "Must be completed within 6 months",
    "Budget limited to $50,000",
    "Must comply with GDPR regulations"
]

initialize_requirements_document(project_name, scope, objectives, features, constraints)
