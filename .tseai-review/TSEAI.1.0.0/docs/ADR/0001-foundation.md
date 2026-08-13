# ADR-0001: Docker-first service boundaries

Status: Accepted

TSEAI starts with independently deployable Identity, Main API, Market Runtime, AI and Notification processes. Infrastructure services are composed with Docker for local/test environments. This avoids a single-process bottleneck while keeping product business modules consolidated in the main API until scale justifies further extraction.
