---
name: Feature request (Rate Limit)
about: Suggest a new feature or improvement
title: "Implement API Rate Limiting for Security and Stability "
labels: enhancement and security.
assignees: ""
---

## Is your feature request related to a problem? Please describe.

- The current API endpoints are publicly accessible without any request rate limits. This presents a security vulnerability and a stability risk.

- If a user or malicious actor were to send an excessive number of requests in a short period (a basic form of Denial-of-Service or brute-force attack).
## Describe the solution you'd like

I propose implementing API Rate Limiting to govern the speed at which clients can interact with our endpoints.

I recommend using the Flask-Limiter extension, as it is a standard, robust, and easy-to-integrate solution for Flask applications that supports multiple storage backends.

- for the endpoint: /api/resourceses/ better if we limit the POST requets limited to 20-30, as the endpoint is more resource-intensive with DataBase involving and limit can prevent the flooding into the DataBase.

- The limiter would use the client's IP address (get_remote_address) as the key for tracking limits.

## Describe alternatives you've considered

Network Layer rate limiting will be good for long-term use, it will prevent malicious traffic before it enters our application.If needed Limits can easily managed across multiple instances of  application in feature.

## Additional context

- By adding the rate limiting can introduce a new type of HTTP error for to many requests when a client hits the limit.

- Feature Scalibility: If the application ever needs to be scaled out to multiple running instances (for horizontal scaling), the rate limit state can be easily centralized, making the rate limiting policy effective across the entire cluster.
