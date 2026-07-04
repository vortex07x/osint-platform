"""
Syncs relational scan data (Postgres/Supabase) into Neo4j as a graph.
Creates nodes for the target, platforms/sources, and entities, with
relationships connecting them — enabling visual exposure graph queries.
"""

from db.neo4j_client import get_neo4j_session


def sync_scan_to_graph(scan_id: str, target_identifier: str, sources: list, entities: list, exposures: list):
    """
    Pushes a completed scan's data into Neo4j.
    - scan_id: str
    - target_identifier: str (the username/email being investigated)
    - sources: list of dicts with id, platform, url
    - entities: list of dicts with id, entity_type, value, source_id
    - exposures: list of dicts with id, severity, risk_score, title, affected_entities
    """
    with get_neo4j_session() as session:
        session.execute_write(_sync_scan_tx, scan_id, target_identifier, sources, entities, exposures)


def _sync_scan_tx(tx, scan_id, target_identifier, sources, entities, exposures):
    # Create/merge the central Target node
    tx.run(
        """
        MERGE (t:Target {id: $scan_id})
        SET t.name = $target_identifier
        """,
        scan_id=scan_id, target_identifier=target_identifier
    )

    # Create/merge Source (platform) nodes and link to Target
    for source in sources:
        tx.run(
            """
            MATCH (t:Target {id: $scan_id})
            MERGE (s:Source {id: $source_id})
            SET s.platform = $platform, s.url = $url
            MERGE (t)-[:FOUND_ON]->(s)
            """,
            scan_id=scan_id,
            source_id=str(source["id"]),
            platform=source["platform"],
            url=source.get("url")
        )

    # Create/merge Entity nodes and link to Target (and Source if known)
    for entity in entities:
        tx.run(
            """
            MATCH (t:Target {id: $scan_id})
            MERGE (e:Entity {id: $entity_id})
            SET e.type = $entity_type, e.value = $value
            MERGE (t)-[:HAS_ENTITY]->(e)
            """,
            scan_id=scan_id,
            entity_id=str(entity["id"]),
            entity_type=entity["entity_type"],
            value=entity["value"]
        )

        if entity.get("source_id"):
            tx.run(
                """
                MATCH (s:Source {id: $source_id})
                MATCH (e:Entity {id: $entity_id})
                MERGE (s)-[:REVEALED]->(e)
                """,
                source_id=str(entity["source_id"]),
                entity_id=str(entity["id"])
            )

    # Create/merge Exposure nodes and link to their affected entities
    for exposure in exposures:
        tx.run(
            """
            MATCH (t:Target {id: $scan_id})
            MERGE (x:Exposure {id: $exposure_id})
            SET x.title = $title, x.severity = $severity, x.risk_score = $risk_score
            MERGE (t)-[:HAS_EXPOSURE]->(x)
            """,
            scan_id=scan_id,
            exposure_id=str(exposure["id"]),
            title=exposure["title"],
            severity=exposure["severity"],
            risk_score=exposure["risk_score"]
        )

        for entity_id in (exposure.get("affected_entities") or []):
            tx.run(
                """
                MATCH (x:Exposure {id: $exposure_id})
                MATCH (e:Entity {id: $entity_id})
                MERGE (x)-[:AFFECTS]->(e)
                """,
                exposure_id=str(exposure["id"]),
                entity_id=str(entity_id)
            )


def get_scan_graph(scan_id: str):
    """
    Retrieves the graph structure for a given scan as nodes + edges,
    formatted for frontend graph visualization libraries.
    """
    with get_neo4j_session() as session:
        result = session.execute_read(_get_graph_tx, scan_id)
        return result


def _get_graph_tx(tx, scan_id):
    query = """
    MATCH (t:Target {id: $scan_id})
    OPTIONAL MATCH (t)-[r1:FOUND_ON]->(s:Source)
    OPTIONAL MATCH (t)-[r2:HAS_ENTITY]->(e:Entity)
    OPTIONAL MATCH (s)-[r3:REVEALED]->(e2:Entity)
    OPTIONAL MATCH (t)-[r4:HAS_EXPOSURE]->(x:Exposure)
    OPTIONAL MATCH (x)-[r5:AFFECTS]->(e3:Entity)
    RETURN t, s, e, e2, x, e3, r1, r2, r3, r4, r5
    """
    result = tx.run(query, scan_id=scan_id)

    nodes = {}
    links = []

    def add_node(node, node_type):
        node_id = node["id"]
        if node_id not in nodes:
            props = dict(node)
            props["type"] = node_type
            nodes[node_id] = props

    for record in result:
        if record["t"]:
            add_node(record["t"], "target")
        if record["s"]:
            add_node(record["s"], "source")
        if record["e"]:
            add_node(record["e"], "entity")
        if record["e2"]:
            add_node(record["e2"], "entity")
        if record["x"]:
            add_node(record["x"], "exposure")
        if record["e3"]:
            add_node(record["e3"], "entity")

        if record["s"] and record["t"]:
            links.append({"source": record["t"]["id"], "target": record["s"]["id"], "type": "FOUND_ON"})
        if record["e"] and record["t"]:
            links.append({"source": record["t"]["id"], "target": record["e"]["id"], "type": "HAS_ENTITY"})
        if record["e2"] and record["s"]:
            links.append({"source": record["s"]["id"], "target": record["e2"]["id"], "type": "REVEALED"})
        if record["x"] and record["t"]:
            links.append({"source": record["t"]["id"], "target": record["x"]["id"], "type": "HAS_EXPOSURE"})
        if record["e3"] and record["x"]:
            links.append({"source": record["x"]["id"], "target": record["e3"]["id"], "type": "AFFECTS"})

    # Deduplicate links
    unique_links = [dict(t) for t in {tuple(d.items()) for d in links}]

    return {"nodes": list(nodes.values()), "links": unique_links}