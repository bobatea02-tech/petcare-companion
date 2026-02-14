"""
Pet Health Knowledge Base Service with RAG (Retrieval Augmented Generation).
Provides veterinary knowledge to enhance AI responses.
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)


@dataclass
class KnowledgeEntry:
    """Represents a single knowledge base entry."""
    id: str
    category: str
    title: str
    content: str
    keywords: List[str]
    pet_types: List[str]  # dog, cat, bird, etc.
    severity: str  # low, medium, high, emergency
    tags: List[str]


class KnowledgeBaseService:
    """Service for managing and querying pet health knowledge."""
    
    def __init__(self):
        self.knowledge_base: List[KnowledgeEntry] = []
        self._initialize_knowledge_base()
    
    def _initialize_knowledge_base(self):
        """Initialize the knowledge base with veterinary information."""
        
        # Common symptoms and conditions
        self.knowledge_base = [
            # ============ DIGESTIVE ISSUES ============
            KnowledgeEntry(
                id="kb_001",
                category="digestive",
                title="Loss of Appetite",
                content="""
Loss of appetite (anorexia) in pets can indicate various conditions:

**Common Causes:**
- Dental problems or mouth pain
- Gastrointestinal upset
- Stress or anxiety
- Change in food or environment
- Underlying illness or infection
- Medication side effects

**Home Care:**
- Try warming food slightly to enhance aroma
- Offer small, frequent meals
- Add low-sodium broth to food
- Ensure fresh water is always available
- Maintain consistent feeding times

**When to See a Vet:**
- No food intake for 24+ hours
- Accompanied by vomiting or diarrhea
- Lethargy or weakness
- Weight loss
- Behavioral changes

**Emergency Signs:**
- Severe lethargy
- Difficulty breathing
- Pale gums
- Collapse
                """,
                keywords=["appetite", "not eating", "anorexia", "food refusal", "hunger"],
                pet_types=["dog", "cat", "bird", "rabbit"],
                severity="medium",
                tags=["nutrition", "behavior", "symptoms"]
            ),
            
            KnowledgeEntry(
                id="kb_002",
                category="digestive",
                title="Vomiting",
                content="""
Vomiting in pets requires careful assessment:

**Types:**
- Acute (sudden onset)
- Chronic (ongoing)
- Regurgitation vs true vomiting

**Common Causes:**
- Dietary indiscretion (eating inappropriate items)
- Food intolerance or allergy
- Intestinal parasites
- Infections (viral, bacterial)
- Toxin ingestion
- Pancreatitis
- Kidney or liver disease

**Home Care (Mild Cases):**
- Withhold food for 6-8 hours (not water)
- Offer small amounts of water frequently
- Bland diet after fasting (boiled chicken and rice)
- Monitor for improvement

**Vet Visit Required:**
- Vomiting more than 2-3 times
- Blood in vomit
- Projectile vomiting
- Accompanied by diarrhea
- Lethargy or pain
- Known toxin ingestion

**Emergency:**
- Continuous vomiting
- Severe abdominal pain
- Bloated abdomen
- Weakness or collapse
- Pale gums
                """,
                keywords=["vomit", "vomiting", "throwing up", "nausea", "sick"],
                pet_types=["dog", "cat"],
                severity="high",
                tags=["digestive", "emergency", "symptoms"]
            ),
            
            KnowledgeEntry(
                id="kb_003",
                category="digestive",
                title="Diarrhea",
                content="""
Diarrhea is a common pet health issue with various causes:

**Types:**
- Acute (sudden, short-term)
- Chronic (ongoing, long-term)
- Large bowel vs small bowel

**Common Causes:**
- Dietary changes or indiscretion
- Food intolerance
- Intestinal parasites
- Bacterial or viral infections
- Stress
- Medications
- Inflammatory bowel disease

**Home Care (Mild Cases):**
- Ensure adequate hydration
- Bland diet (boiled chicken and rice)
- Small, frequent meals
- Probiotics (pet-specific)
- Monitor stool consistency

**Vet Visit Needed:**
- Diarrhea lasting more than 24 hours
- Blood in stool
- Black, tarry stools
- Accompanied by vomiting
- Lethargy or weakness
- Dehydration signs

**Emergency:**
- Severe, watery diarrhea
- Profuse bleeding
- Severe abdominal pain
- Collapse or extreme weakness
                """,
                keywords=["diarrhea", "loose stool", "runny stool", "bowel", "poop"],
                pet_types=["dog", "cat", "rabbit"],
                severity="medium",
                tags=["digestive", "symptoms"]
            ),
            
            # ============ SKIN CONDITIONS ============
            KnowledgeEntry(
                id="kb_004",
                category="skin",
                title="Itching and Scratching",
                content="""
Excessive itching (pruritus) can significantly affect pet quality of life:

**Common Causes:**
- Fleas and flea allergy dermatitis
- Environmental allergies (pollen, dust)
- Food allergies
- Skin infections (bacterial, fungal)
- Parasites (mites, lice)
- Dry skin
- Contact dermatitis

**Home Remedies:**
- Oatmeal baths (colloidal oatmeal)
- Coconut oil on affected areas
- Apple cider vinegar spray (diluted 50/50)
- Regular flea prevention
- Hypoallergenic diet trial
- Omega-3 fatty acid supplements

**When to See Vet:**
- Severe, constant scratching
- Hair loss or bald patches
- Red, inflamed skin
- Open sores or wounds
- Foul odor
- Ear infections
- Not responding to home care

**Prevention:**
- Regular flea/tick prevention
- Proper grooming
- Balanced diet
- Identify and avoid allergens
                """,
                keywords=["itch", "itching", "scratch", "scratching", "skin", "allergy"],
                pet_types=["dog", "cat"],
                severity="low",
                tags=["skin", "allergies", "parasites"]
            ),
            
            # ============ RESPIRATORY ============
            KnowledgeEntry(
                id="kb_005",
                category="respiratory",
                title="Coughing",
                content="""
Coughing in pets can indicate various respiratory or cardiac issues:

**Types of Coughs:**
- Dry, hacking cough
- Wet, productive cough
- Honking cough
- Gagging cough

**Common Causes:**
- Kennel cough (infectious tracheobronchitis)
- Heart disease
- Tracheal collapse
- Pneumonia
- Allergies
- Foreign body
- Lungworm

**Home Monitoring:**
- Note frequency and type of cough
- Check for other symptoms
- Monitor activity level
- Ensure adequate hydration
- Avoid irritants (smoke, perfumes)

**Vet Visit Required:**
- Persistent coughing (more than a few days)
- Difficulty breathing
- Blue or pale gums
- Lethargy
- Loss of appetite
- Fever

**Emergency:**
- Severe breathing difficulty
- Choking
- Collapse
- Blue gums
- Continuous, severe coughing
                """,
                keywords=["cough", "coughing", "breathing", "respiratory", "wheeze"],
                pet_types=["dog", "cat"],
                severity="high",
                tags=["respiratory", "symptoms"]
            ),
            
            # ============ URINARY ============
            KnowledgeEntry(
                id="kb_006",
                category="urinary",
                title="Urinary Issues",
                content="""
Urinary problems require prompt attention:

**Common Issues:**
- Urinary tract infection (UTI)
- Bladder stones
- Kidney disease
- Urinary blockage (EMERGENCY)
- Incontinence

**Symptoms:**
- Frequent urination attempts
- Straining to urinate
- Blood in urine
- Accidents in house
- Crying during urination
- Excessive licking of genital area
- Strong urine odor

**Home Monitoring:**
- Increase water intake
- Monitor urination frequency
- Note urine color and odor
- Keep litter box/potty area clean

**Vet Visit Needed:**
- Any urinary symptoms
- Blood in urine
- Straining without producing urine
- Frequent accidents
- Pain during urination

**EMERGENCY:**
- Unable to urinate (especially male cats)
- Severe straining
- Crying in pain
- Bloated abdomen
- Lethargy with urinary symptoms

**Note:** Urinary blockage is life-threatening and requires immediate emergency care.
                """,
                keywords=["urinate", "urination", "pee", "bladder", "uti", "urine"],
                pet_types=["dog", "cat"],
                severity="high",
                tags=["urinary", "emergency", "symptoms"]
            ),
            
            # ============ PAIN & MOBILITY ============
            KnowledgeEntry(
                id="kb_007",
                category="pain",
                title="Limping and Lameness",
                content="""
Limping can indicate injury or underlying conditions:

**Common Causes:**
- Sprains or strains
- Fractures
- Arthritis
- Hip dysplasia
- Torn ligament (ACL/CCL)
- Paw pad injury
- Nail injury
- Bone infection

**Assessment:**
- Which leg is affected
- Severity (weight-bearing or not)
- Sudden onset or gradual
- Swelling or heat
- Pain on touch

**Home Care (Mild Cases):**
- Rest and limit activity
- Cold compress (first 24 hours)
- Warm compress (after 24 hours)
- Check paws for foreign objects
- Trim nails if overgrown

**Vet Visit Needed:**
- Severe limping or non-weight bearing
- Visible deformity
- Swelling or heat
- Not improving after 24 hours
- Crying in pain
- Fever

**Emergency:**
- Suspected fracture
- Severe pain
- Unable to stand
- Dragging limb
                """,
                keywords=["limp", "limping", "lame", "lameness", "leg", "pain", "walk"],
                pet_types=["dog", "cat"],
                severity="medium",
                tags=["mobility", "pain", "injury"]
            ),
            
            # ============ BEHAVIORAL ============
            KnowledgeEntry(
                id="kb_008",
                category="behavioral",
                title="Lethargy and Weakness",
                content="""
Lethargy is a non-specific symptom that can indicate serious illness:

**Possible Causes:**
- Infection or fever
- Pain
- Anemia
- Heart disease
- Metabolic disorders
- Poisoning
- Cancer
- Depression

**Assessment:**
- Sudden or gradual onset
- Other symptoms present
- Eating and drinking
- Temperature
- Gum color

**When to See Vet:**
- Sudden, severe lethargy
- Not eating or drinking
- Accompanied by other symptoms
- Lasting more than 24 hours
- Pale gums
- Difficulty breathing

**Emergency:**
- Collapse
- Unresponsive
- Severe weakness
- Blue or white gums
- Difficulty breathing
- Known toxin exposure
                """,
                keywords=["lethargy", "lethargic", "tired", "weak", "weakness", "energy"],
                pet_types=["dog", "cat", "bird", "rabbit"],
                severity="high",
                tags=["symptoms", "emergency"]
            ),
            
            # ============ PREVENTIVE CARE ============
            KnowledgeEntry(
                id="kb_009",
                category="preventive",
                title="Vaccination Schedule",
                content="""
Vaccinations protect pets from serious diseases:

**Core Vaccines (Dogs):**
- Rabies (required by law)
- DHPP (Distemper, Hepatitis, Parainfluenza, Parvovirus)
  - Puppy series: 6-8, 10-12, 14-16 weeks
  - Booster: 1 year, then every 1-3 years

**Core Vaccines (Cats):**
- Rabies (required by law)
- FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)
  - Kitten series: 6-8, 10-12, 14-16 weeks
  - Booster: 1 year, then every 1-3 years

**Non-Core Vaccines (Based on Lifestyle):**
Dogs:
- Bordetella (Kennel Cough)
- Leptospirosis
- Lyme disease
- Canine Influenza

Cats:
- FeLV (Feline Leukemia)
- FIV (Feline Immunodeficiency Virus)

**Important Notes:**
- Follow your veterinarian's recommendations
- Keep vaccination records
- Some vaccines may cause mild side effects
- Titers can check immunity levels
                """,
                keywords=["vaccine", "vaccination", "shot", "immunization", "rabies"],
                pet_types=["dog", "cat"],
                severity="low",
                tags=["preventive", "health", "vaccination"]
            ),
            
            # ============ NUTRITION ============
            KnowledgeEntry(
                id="kb_010",
                category="nutrition",
                title="Proper Pet Nutrition",
                content="""
Balanced nutrition is essential for pet health:

**Basic Nutritional Needs:**
- Protein (essential amino acids)
- Fats (essential fatty acids)
- Carbohydrates (energy)
- Vitamins and minerals
- Water (most important)

**Life Stage Feeding:**
- Puppies/Kittens: High protein, frequent meals
- Adults: Balanced maintenance diet
- Seniors: Lower calories, joint support
- Pregnant/Nursing: Increased calories and nutrients

**Feeding Guidelines:**
- Follow package recommendations
- Adjust for activity level
- Monitor body condition
- Consistent feeding times
- Fresh water always available

**Foods to Avoid:**
- Chocolate
- Grapes and raisins
- Onions and garlic
- Xylitol (artificial sweetener)
- Alcohol
- Caffeine
- Macadamia nuts
- Avocado

**Signs of Good Nutrition:**
- Healthy weight
- Shiny coat
- Good energy level
- Healthy stools
- Bright eyes

**When to Consult Vet:**
- Weight changes
- Food allergies
- Digestive issues
- Special dietary needs
- Prescription diet requirements
                """,
                keywords=["food", "diet", "nutrition", "feeding", "eat", "meal"],
                pet_types=["dog", "cat", "bird", "rabbit"],
                severity="low",
                tags=["nutrition", "preventive", "diet"]
            ),
        ]
        
        logger.info(f"Knowledge base initialized with {len(self.knowledge_base)} entries")
    
    def search(
        self,
        query: str,
        pet_type: Optional[str] = None,
        max_results: int = 3
    ) -> List[KnowledgeEntry]:
        """
        Search knowledge base for relevant entries.
        
        Args:
            query: Search query (symptoms, keywords)
            pet_type: Filter by pet type
            max_results: Maximum number of results to return
            
        Returns:
            List of relevant knowledge entries
        """
        query_lower = query.lower()
        results = []
        
        for entry in self.knowledge_base:
            # Skip if pet type doesn't match
            if pet_type and pet_type.lower() not in [pt.lower() for pt in entry.pet_types]:
                continue
            
            # Calculate relevance score
            score = 0
            
            # Check keywords
            for keyword in entry.keywords:
                if keyword.lower() in query_lower:
                    score += 10
            
            # Check title
            if any(word in entry.title.lower() for word in query_lower.split()):
                score += 5
            
            # Check content
            if any(word in entry.content.lower() for word in query_lower.split()):
                score += 2
            
            if score > 0:
                results.append((score, entry))
        
        # Sort by score and return top results
        results.sort(key=lambda x: x[0], reverse=True)
        return [entry for score, entry in results[:max_results]]
    
    def get_by_category(self, category: str) -> List[KnowledgeEntry]:
        """Get all entries in a category."""
        return [entry for entry in self.knowledge_base if entry.category == category]
    
    def get_by_severity(self, severity: str) -> List[KnowledgeEntry]:
        """Get all entries by severity level."""
        return [entry for entry in self.knowledge_base if entry.severity == severity]
    
    def format_for_ai(self, entries: List[KnowledgeEntry]) -> str:
        """
        Format knowledge entries for AI context.
        
        Args:
            entries: List of knowledge entries
            
        Returns:
            Formatted string for AI prompt
        """
        if not entries:
            return ""
        
        formatted = "**Relevant Veterinary Knowledge:**\n\n"
        
        for i, entry in enumerate(entries, 1):
            formatted += f"{i}. **{entry.title}** ({entry.category})\n"
            formatted += f"Severity: {entry.severity.upper()}\n"
            formatted += f"{entry.content}\n\n"
        
        return formatted
    
    def get_emergency_keywords(self) -> List[str]:
        """Get list of emergency keywords."""
        return [
            "emergency", "urgent", "severe", "collapse", "unconscious",
            "bleeding", "seizure", "poisoning", "toxin", "choking",
            "difficulty breathing", "blue gums", "can't urinate",
            "bloated", "trauma", "hit by car", "broken bone"
        ]
    
    def is_emergency(self, query: str) -> bool:
        """Check if query contains emergency keywords."""
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in self.get_emergency_keywords())


# Global instance
knowledge_base_service = KnowledgeBaseService()
