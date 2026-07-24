import os
import sys

def seed_catalyst_admin():
    print("Initializing Zoho Catalyst SDK...")
    try:
        import zcatalyst_sdk
        app = zcatalyst_sdk.initialize()
        auth = app.authentication()
        
        # In Zoho Catalyst, authentication requires a valid email format.
        # We use a synthetic email to map the Badge ID to Zoho Auth.
        admin_email = "admin@ksp.gov.in"
        
        print(f"Registering admin user: {admin_email}")
        
        user_config = {
            "first_name": "System",
            "last_name": "Administrator",
            "email_id": admin_email,
            "role_details": {
                "role_name": "AppUser" # Default role in Catalyst
            }
        }
        
        # Register the user
        user = auth.register_user(user_config)
        print("Successfully registered user in Catalyst Auth!")
        print(f"User ID: {user.get_user_id()}")
        
    except Exception as e:
        print(f"Failed to register user: {e}")
        print("Ensure that you have enabled Email Authentication in your Zoho Catalyst Console -> Authentication -> Setup.")

if __name__ == "__main__":
    seed_catalyst_admin()
