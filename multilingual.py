import logging
import config
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = [
    "English", "Hindi", "Marathi", "Tamil", "Telugu", 
    "Bengali", "Gujarati", "Kannada", "Malayalam", 
    "Punjabi", "Urdu"
]

def _get_llm() -> OllamaLLM:
    """Initialize and return the Ollama LLM."""
    return OllamaLLM(model=config.OLLAMA_MODEL, base_url=config.OLLAMA_BASE_URL)

def get_supported_languages() -> list[str]:
    """Return the list of supported language names."""
    return SUPPORTED_LANGUAGES

def translate_text(text: str, target_language: str) -> str:
    """
    Translate the given text to the target language using the LLM.
    Truncates input to 3000 chars. 
    """
    if not text:
        return ""
    
    truncated_text = text[:3000]
    
    prompt = PromptTemplate.from_template(
        "Translate the following text to {target_language}. "
        "Ensure the translation is accurate and preserves legal meaning and terminology.\n\n"
        "Text to translate:\n{text}\n\n"
        "Translation:"
    )
    
    try:
        llm = _get_llm()
        chain = prompt | llm
        result = chain.invoke({"target_language": target_language, "text": truncated_text})
        return result.strip()
    except Exception as e:
        logger.error(f"Error during translation: {e}")
        return f"Error: Unable to translate text. Please check the LLM connection. Details: {e}"

def summarize_in_language(text: str, target_language: str) -> str:
    """
    Generate a plain-language summary (max 200 words) of the document directly in the target language.
    """
    if not text:
        return ""
        
    prompt = PromptTemplate.from_template(
        "Provide a plain-language summary of the following document directly in {target_language}. "
        "The summary should be concise, capturing the main points, and must not exceed 200 words.\n\n"
        "Document:\n{text}\n\n"
        "Summary in {target_language}:"
    )
    
    try:
        llm = _get_llm()
        chain = prompt | llm
        result = chain.invoke({"target_language": target_language, "text": text})
        return result.strip()
    except Exception as e:
        logger.error(f"Error during summarization: {e}")
        return f"Error: Unable to summarize text. Please check the LLM connection. Details: {e}"

def detect_language(text: str) -> str:
    """
    Ask the LLM to detect the language of the given text (first 500 chars).
    Return the language name.
    """
    if not text:
        return "Unknown"
        
    truncated_text = text[:500]
    
    prompt = PromptTemplate.from_template(
        "Detect the language of the following text. "
        "Respond ONLY with the name of the language (e.g., English, Hindi, Spanish) and nothing else.\n\n"
        "Text:\n{text}\n\n"
        "Language:"
    )
    
    try:
        llm = _get_llm()
        chain = prompt | llm
        result = chain.invoke({"text": truncated_text})
        return result.strip()
    except Exception as e:
        logger.error(f"Error during language detection: {e}")
        return f"Error: Unable to detect language. Details: {e}"
