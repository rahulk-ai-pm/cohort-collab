import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STORAGE_URL = os.environ.get('STORAGE_URL', 'https://integrations.emergentagent.com/objstore/api/v1/storage')
APP_NAME = os.environ.get('APP_NAME', 'iimk-apm06')
SESSION_EXPIRY_DAYS = 7

PROGRAM_CONTEXT = """
IIM Kozhikode - Professional Certificate Programme in Advanced Product Management (Batch 06)
Duration: 6 months (March 2026 - September 2026), Online, Sundays 9:00 AM - 12:00 PM
Programme Coordinator: Prof. Atanu Adhikari

CURRICULUM (20 Modules):
Module 01: Introduction - Value Creation, Communication, and Delivery
Module 02: Product and its Value Proposition - Choosing the Right Target Market
Module 03: Strategic Elements in Product Management and Product Roadmap
Module 04: Market Segmentation, Target Market Selection, and Buyer's Persona
Module 05: Managing Product Positioning
Module 06: Innovation in Product Management and Disruptive Innovation
Module 07-08: Simulation - Crossing the Chasm
Module 09: New Product Development Process
Module 10-11: Analytics For Product Managers Part 1 - Qualitative/Quantitative Analytics
Module 12: Analytics Part 2 - Conjoint Analysis, Market Share Estimation
Module 13: Product, Market Orientation, and Competitor Orientation
Module 14: Product Management at the Bottom of the Pyramid
Module 15: Agile Product Management, MVP, and MDP
Module 16: Managing Products in Business Market
Module 17: Analytics Part 3 - Market Segmentation, Segment Size, Profiling
Module 18-20: Comprehensive Simulation on Product Management

CASE STUDIES: Indraprastha Cold Storage, Linc to Luxury, Novartis: Beyond the Blockbuster,
Turtle's Transformation, Wow Momo: From Local to Global, Burger King The Moldy Whopper

PROJECTS: Capstone Project (real-world product strategy analysis) and Real-life Project (data collection, analysis, recommendations)

SIMULATIONS: Crossing the Chasm (AeroMechanical's FLYHT Challenge), Marker Motion (B2B Marketing Mix)

ASSESSMENT: Class participation (25), Simulations (25), Quizzes (25), Real-life project (50), Capstone (25) = 150 marks total. 60% needed for Certificate of Completion.

ELIGIBILITY: Bachelor's degree + 5 years work experience. Fee: Rs 1,68,000 + Taxes.
"""

APM_SKILLS = [
    "Data Analysis", "Market Research", "Product Strategy", "Financial Modeling",
    "Tech/Prototyping", "UX/Design", "Marketing/GTM", "Business Development",
    "Operations", "Leadership", "Project Management", "Agile/Scrum",
    "Consumer Insights", "Competitive Analysis", "Pricing Strategy",
    "Supply Chain", "Digital Marketing", "Sales Strategy"
]
