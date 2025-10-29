import spacy
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

nlp = None
model = None

def get_nlp():
    global nlp
    if nlp is None:
        nlp = spacy.load("en_core_web_sm")
    return nlp

def get_model():
    global model
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
    return model

def extract_keywords(content, max_keywords=10):
    """
    Extract keywords from content using spaCy.
    
    Args:
        content: Text content to analyze
        max_keywords: Maximum number of keywords to extract
    
    Returns:
        List of extracted keywords
    """
    nlp = get_nlp()
    doc = nlp(content)
    
    # Extract keywords based on POS tags and entity types
    keywords = []
    
    # Add named entities
    for ent in doc.ents:
        if ent.label_ in ['PERSON', 'ORG', 'GPE', 'PRODUCT', 'EVENT', 'WORK_OF_ART', 'LAW']:
            keywords.append(ent.text.lower())
    
    # Add noun phrases and important nouns
    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) <= 3:  # Keep shorter phrases
            keywords.append(chunk.text.lower())
    
    # Add individual nouns, proper nouns, and adjectives that might be relevant
    for token in doc:
        if token.pos_ in ['NOUN', 'PROPN', 'ADJ'] and not token.is_stop and len(token.text) > 2:
            keywords.append(token.lemma_.lower())
    
    # Remove duplicates and limit
    keywords = list(set(keywords))[:max_keywords]
    return keywords

def detect_tags(content, candidate_tags=None, top_k=5, threshold=0.3):
    """
    Detect relevant tags for content using the complete NLP pathway:
    1. spaCy analyzes content → extracts keywords
    2. Sentence Transformers encodes content + all candidate tags  
    3. Calculate cosine similarity between content and each tag
    4. Return ranked suggestions in JSON format, including extracted keywords as fallback
    
    Args:
        content: Response content
        candidate_tags: List of available tags to match against
        top_k: Number of top suggestions to return
        threshold: Minimum similarity score (0-1)
    
    Returns:
        List of dicts with 'tag' and 'score' keys, sorted by score
    """
    
    # Step 1: spaCy analyzes content → extracts keywords
    keywords = extract_keywords(content)
    
    enhanced_content = content
    if keywords:
        enhanced_content += " " + " ".join(keywords)
    
    suggestions = []
    
    # Step 2: Sentence Transformers encodes content + all candidate tags    
    if candidate_tags:
        model = get_model()
        
        content_embedding = model.encode(enhanced_content, convert_to_tensor=False)
        tag_embeddings = model.encode(candidate_tags, convert_to_tensor=False)
        
        if hasattr(content_embedding, 'cpu'):
            content_embedding = content_embedding.cpu().numpy()
        if hasattr(tag_embeddings, 'cpu'):
            tag_embeddings = tag_embeddings.cpu().numpy()
        
    # Step 3: Calculate cosine similarity between content and each tag
        similarities = cosine_similarity(
            [content_embedding],
            tag_embeddings
        )[0]
        
    # Step 4: Collect suggestions from database tags
        for tag, score in zip(candidate_tags, similarities):
            if score >= threshold:
                suggestions.append({"tag": tag, "score": float(score), "source": "database"})
    
    # Step 5: Add extracted keywords as additional suggestions if we have fewer than top_k
    if len(suggestions) == 0 and keywords:
        model = get_model()
        content_embedding = model.encode(enhanced_content, convert_to_tensor=False)
        if hasattr(content_embedding, 'cpu'):
            content_embedding = content_embedding.cpu().numpy()
        
        keyword_embeddings = model.encode(keywords, convert_to_tensor=False)
        if hasattr(keyword_embeddings, 'cpu'):
            keyword_embeddings = keyword_embeddings.cpu().numpy()
        
        keyword_similarities = cosine_similarity(
            [content_embedding],
            keyword_embeddings
        )[0]
        
        for keyword, score in zip(keywords, keyword_similarities):
            if not any(s['tag'].lower() == keyword.lower() for s in suggestions):
                adjusted_score = float(score) * 0.7
                if adjusted_score >= threshold * 0.5: 
                    suggestions.append({"tag": keyword, "score": adjusted_score, "source": "extracted"})
    
    # Sort by score descending and return top_k
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return suggestions[:top_k]