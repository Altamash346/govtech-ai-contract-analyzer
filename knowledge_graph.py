import json
import logging
from typing import Dict, Any, List, Tuple
import config
from langchain_ollama import OllamaLLM
from streamlit_agraph import Node, Edge, Config

logger = logging.getLogger(__name__)

def _safe_parse_json(json_str: str) -> Dict[str, Any]:
    """Safely parse JSON string, handling potential malformed output from LLM."""
    try:
        # Simple cleanup in case LLM wraps output in markdown code blocks
        if "```json" in json_str:
            json_str = json_str.split("```json")[1]
        if "```" in json_str:
            json_str = json_str.split("```")[0]
        return json.loads(json_str.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from LLM: {e}\nRaw output: {json_str}")
        return {"nodes": [], "edges": []}
    except Exception as e:
        logger.error(f"Unexpected error parsing JSON: {e}")
        return {"nodes": [], "edges": []}

def extract_knowledge_graph(document_text: str) -> Dict[str, Any]:
    """
    Extract entities and relationships from document text to build a knowledge graph.
    Returns a dict with 'nodes' and 'edges'.
    """
    if not document_text:
        return {"nodes": [], "edges": []}
        
    text_to_process = document_text[:4000]
    
    prompt = f"""
    Analyze the following contract/legal document text and extract a knowledge graph.
    Identify key entities and their relationships.
    
    Output strictly in JSON format with the following structure:
    {{
      "nodes": [
        {{"id": "unique_id_1", "label": "Display Name", "type": "Entity Type"}}
      ],
      "edges": [
        {{"source": "unique_id_1", "target": "unique_id_2", "label": "relationship description"}}
      ]
    }}
    
    Valid Entity Types for nodes: "Person", "Organization", "Date", "Amount", "Clause", "Obligation".
    Example edge labels: 'must pay', 'terminates on', 'governed by', 'reports to'.
    
    Document Text:
    {text_to_process}
    """
    
    try:
        llm = OllamaLLM(model=config.OLLAMA_MODEL, base_url=config.OLLAMA_BASE_URL)
        response = llm.invoke(prompt)
        return _safe_parse_json(response)
    except Exception as e:
        logger.error(f"Error invoking LLM for knowledge graph extraction: {e}")
        return {"nodes": [], "edges": []}

def build_agraph_data(kg_data: Dict[str, Any]) -> Tuple[List[Node], List[Edge], Config]:
    """
    Converts extracted knowledge graph into streamlit_agraph compatible format.
    """
    nodes_list = []
    edges_list = []
    
    color_map = {
        "Person": "#3498db",        # blue
        "Organization": "#2ecc71",  # green
        "Date": "#e67e22",          # orange
        "Amount": "#e74c3c",        # red
        "Clause": "#9b59b6",        # purple
        "Obligation": "#f1c40f"     # yellow
    }
    
    size_map = {
        "Person": 20,
        "Organization": 25,
        "Date": 15,
        "Amount": 15,
        "Clause": 20,
        "Obligation": 20
    }
    
    try:
        raw_nodes = kg_data.get("nodes", [])
        raw_edges = kg_data.get("edges", [])
        
        for n in raw_nodes:
            node_id = n.get("id")
            label = n.get("label", str(node_id))
            node_type = n.get("type", "Unknown")
            
            if not node_id:
                continue
                
            color = color_map.get(node_type, "#95a5a6") # default gray
            size = size_map.get(node_type, 15)
            
            nodes_list.append(
                Node(id=node_id, 
                     label=label, 
                     size=size, 
                     color=color,
                     title=f"Type: {node_type}") # Tooltip
            )
            
        for e in raw_edges:
            source = e.get("source")
            target = e.get("target")
            label = e.get("label", "")
            
            if not source or not target:
                continue
                
            edges_list.append(
                Edge(source=source, 
                     target=target, 
                     label=label, 
                     type="CURVE_SMOOTH")
            )
            
    except Exception as e:
        logger.error(f"Error building agraph data: {e}")
        # Return empty but valid structures on failure
        nodes_list = []
        edges_list = []
        
    cfg = Config(width=700,
                 height=500,
                 directed=True,
                 physics=True,
                 hierarchical=False,
                 from_json=False)
                 
    return nodes_list, edges_list, cfg
