from jinja2 import Template, Environment, FileSystemLoader
import os

class Templates:
    def __init__(self, template_dir='.'):
        """
        Initialize Templates class to load HTML files from filesystem
        
        Args:
            template_dir (str): Directory containing the .html template files
        """
        self.template_dir = template_dir
        
        # Create Jinja2 environment with FileSystemLoader
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=True  # Enable auto-escaping for security
        )
    
    def render(self, template_name, **context):
        """
        Render a template with the given context
        
        Args:
            template_name (str): Name of the template file (e.g., 'dashboard.html')
            **context: Variables to pass to the template
            
        Returns:
            str: Rendered HTML content
        """
        try:
            template = self.env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            return f"Error rendering template '{template_name}': {str(e)}"
    
    def get_available_templates(self):
        """
        Return list of available HTML template files
        
        Returns:
            list: List of .html files in the template directory
        """
        try:
            files = os.listdir(self.template_dir)
            html_files = [f for f in files if f.endswith('.html')]
            return sorted(html_files)
        except Exception as e:
            return []
    
    def template_exists(self, template_name):
        """
        Check if a template file exists
        
        Args:
            template_name (str): Name of the template file
            
        Returns:
            bool: True if template exists, False otherwise
        """
        template_path = os.path.join(self.template_dir, template_name)
        return os.path.isfile(template_path)

# Example usage
if __name__ == "__main__":
    # Initialize templates (assumes .html files are in current directory)
    templates = Templates()
    
    # Example context data
    dashboard_data = {
        'title': 'Aviation Dashboard',
        'crew_count': 25,
        'flights_today': 8,
        'hours_scheduled': 45,
        'alerts': 2
    }
    
    # Render dashboard template
    if templates.template_exists('dashboard.html'):
        html_output = templates.render('dashboard.html', **dashboard_data)
        print("Dashboard template rendered successfully!")
        print(f"Output length: {len(html_output)} characters")
    else:
        print("dashboard.html not found")
    
    # List available templates
    available = templates.get_available_templates()
    print(f"Available templates: {available}")
