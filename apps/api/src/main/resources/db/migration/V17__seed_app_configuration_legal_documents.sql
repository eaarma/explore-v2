UPDATE app_configuration
SET privacy_policy_document = $${
  "eyebrow": "Policy",
  "title": "Privacy policy",
  "description": "Last updated: May 31, 2026",
  "sections": [
    {
      "title": "Overview",
      "body": "Explore (\"the App\") is a location-based exploration application that helps users discover locations, complete journeys, and track exploration progress."
    },
    {
      "title": "Information We Collect",
      "body": "When you create an account, we may collect:",
      "items": [
        "Username",
        "Email address",
        "Account credentials (stored securely)"
      ]
    },
    {
      "title": "App Usage Data",
      "body": "When using the App, we may collect:",
      "items": [
        "Location information necessary for discovery functionality",
        "Discovery and journey completion progress",
        "User-generated content such as notes, trip information, or uploaded images",
        "Basic technical information required for application operation and security"
      ]
    },
    {
      "title": "How We Use Information",
      "body": "We use collected information to:",
      "items": [
        "Provide account functionality",
        "Authenticate users",
        "Track discovered locations and completed journeys",
        "Synchronize progress across devices",
        "Display user content within the App",
        "Improve application performance and reliability",
        "Protect the security of the service"
      ]
    },
    {
      "title": "Location Data",
      "body": "The App uses your device location to determine when you are near locations and journeys.\n\nLocation data is used only for functionality related to exploration, discovery, navigation, and progress tracking.\n\nThe App does not sell location data to third parties."
    },
    {
      "title": "Image Uploads",
      "body": "Images uploaded through the App may be stored in cloud storage services used by Explore.\n\nUploaded images may be visible to authorized administrators and, where applicable, other users of the App.\n\nUsers are responsible for ensuring they have the right to upload any images they submit."
    },
    {
      "title": "Data Storage",
      "body": "User data may be stored on servers operated by Explore or trusted service providers used to operate the service.\n\nReasonable security measures are used to protect stored information."
    },
    {
      "title": "Account Deletion",
      "body": "Users may request deletion of their account and associated personal data through the account settings section or by contacting the application administrator.\n\nCertain information may be retained where required for security, legal, or operational reasons."
    },
    {
      "title": "Third-Party Services",
      "body": "The App may use third-party services including:",
      "items": [
        "Mapping providers",
        "Cloud storage providers",
        "Authentication services",
        "Analytics and crash reporting services"
      ]
    },
    {
      "title": "Third-Party Processing",
      "body": "These services may process data necessary to provide their functionality."
    },
    {
      "title": "Children's Privacy",
      "body": "The App is not directed toward children under the age required by applicable law without parental permission."
    },
    {
      "title": "Changes To This Policy",
      "body": "This Privacy Policy may be updated from time to time.\n\nContinued use of the App after updates constitutes acceptance of the revised policy."
    },
    {
      "title": "Contact",
      "body": "If you have questions regarding this Privacy Policy, please contact:\n\nsupport@explore.app"
    }
  ]
}$$::jsonb,
terms_document = $${
  "eyebrow": "Terms",
  "title": "Terms of Service",
  "description": "Last updated: May 31, 2026",
  "sections": [
    {
      "title": "Welcome",
      "body": "Welcome to Explore (\"the App\").\n\nBy creating an account, accessing, or using the App, you agree to these Terms of Service.\n\nIf you do not agree with these Terms, you must not use the App."
    },
    {
      "title": "1. Description of Service",
      "body": "Explore is a location-based exploration platform that allows users to:",
      "items": [
        "Discover locations",
        "View journeys and routes",
        "Track exploration progress",
        "Upload content where permitted",
        "Interact with exploration-related information"
      ]
    },
    {
      "title": "Service Purpose",
      "body": "The App is provided for informational and recreational purposes."
    },
    {
      "title": "2. User Accounts",
      "body": "To access certain features, users may be required to create an account.\n\nUsers are responsible for:",
      "items": [
        "Maintaining the security of their account",
        "Protecting their login credentials",
        "All activity occurring under their account"
      ]
    },
    {
      "title": "Account Accuracy",
      "body": "Users must provide accurate account information."
    },
    {
      "title": "3. User Conduct",
      "body": "Users agree not to:",
      "items": [
        "Violate applicable laws",
        "Harass, threaten, or abuse others",
        "Upload unlawful, offensive, or infringing content",
        "Attempt unauthorized access to systems or accounts",
        "Disrupt or interfere with the operation of the App",
        "Submit false or misleading information intentionally"
      ]
    },
    {
      "title": "Enforcement",
      "body": "Explore reserves the right to suspend or terminate accounts that violate these rules."
    },
    {
      "title": "4. Location Information Disclaimer",
      "body": "Location information provided within the App may be incomplete, outdated, inaccurate, inaccessible, unavailable, or subject to change without notice.\n\nExplore does not guarantee:",
      "items": [
        "Accuracy of coordinates",
        "Accessibility of locations",
        "Current condition of locations",
        "Availability of routes or journeys"
      ]
    },
    {
      "title": "Independent Judgment",
      "body": "Users are responsible for independently evaluating locations before visiting."
    },
    {
      "title": "5. Outdoor Activity and Personal Responsibility",
      "body": "Exploration activities may involve risks including:",
      "items": [
        "Uneven terrain",
        "Water hazards",
        "Wildlife",
        "Weather conditions",
        "Remote areas",
        "Physical injury"
      ]
    },
    {
      "title": "Assumption of Risk",
      "body": "Users participate entirely at their own risk.\n\nExplore is not responsible for injuries, losses, damages, accidents, or other consequences resulting from visits to locations displayed within the App."
    },
    {
      "title": "6. Private Property and Restricted Areas",
      "body": "The presence of a location within the App does not grant permission to enter or access that location.\n\nUsers are responsible for:",
      "items": [
        "Respecting private property",
        "Following local laws and regulations",
        "Following posted restrictions",
        "Obtaining required permissions"
      ]
    },
    {
      "title": "Trespassing",
      "body": "Users must not trespass or enter prohibited areas."
    },
    {
      "title": "7. Abandoned and Historic Locations",
      "body": "Some locations may include abandoned, historic, industrial, military, or otherwise unusual sites.\n\nExplore does not encourage:",
      "items": [
        "Trespassing",
        "Vandalism",
        "Theft",
        "Property damage",
        "Unsafe behavior"
      ]
    },
    {
      "title": "Lawful and Safe Use",
      "body": "Users are solely responsible for ensuring that any visit is lawful and safe."
    },
    {
      "title": "8. User Content",
      "body": "Users may submit content including:",
      "items": [
        "Images",
        "Notes",
        "Comments",
        "Other materials"
      ]
    },
    {
      "title": "Content License",
      "body": "By submitting content, users grant Explore a non-exclusive license to store, display, and use that content for operation of the service.\n\nUsers remain responsible for ensuring they have the necessary rights to any submitted content.\n\nExplore does not guarantee the accuracy, legality, completeness, or suitability of user-submitted content."
    },
    {
      "title": "9. Content Moderation",
      "body": "Explore may remove, edit, restrict, or reject content at its discretion.\n\nAccounts may be suspended or terminated for violations of these Terms."
    },
    {
      "title": "10. Intellectual Property",
      "body": "The App, its design, branding, and original content are owned by Explore or its licensors.\n\nUsers may not copy, redistribute, or commercially exploit App content without permission unless otherwise permitted by law."
    },
    {
      "title": "11. Service Availability",
      "body": "Explore is provided on an \"as available\" basis.\n\nWe do not guarantee:",
      "items": [
        "Continuous availability",
        "Error-free operation",
        "Uninterrupted access",
        "Compatibility with all devices"
      ]
    },
    {
      "title": "Feature Changes",
      "body": "Features may change, be modified, or be discontinued at any time."
    },
    {
      "title": "12. Limitation of Liability",
      "body": "To the maximum extent permitted by law, Explore and its operators shall not be liable for:",
      "items": [
        "Personal injury",
        "Property damage",
        "Lost profits",
        "Data loss",
        "Service interruptions",
        "Indirect or consequential damages"
      ]
    },
    {
      "title": "Liability Scope",
      "body": "This limitation applies to claims arising from use of the App, reliance on information provided by the App, visits to locations displayed within the App, or user-generated content."
    },
    {
      "title": "13. Account Suspension and Termination",
      "body": "Explore may suspend or terminate accounts for:",
      "items": [
        "Violations of these Terms",
        "Abuse of the service",
        "Fraudulent activity",
        "Security concerns"
      ]
    },
    {
      "title": "User-Initiated Exit",
      "body": "Users may stop using the service and request account deletion at any time."
    },
    {
      "title": "14. Changes to These Terms",
      "body": "These Terms may be updated from time to time.\n\nContinued use of the App following changes constitutes acceptance of the updated Terms."
    },
    {
      "title": "15. Contact",
      "body": "Questions regarding these Terms may be directed to:\n\nsupport@explore.app"
    }
  ]
}$$::jsonb,
updated_at = NOW()
WHERE id = 1;
