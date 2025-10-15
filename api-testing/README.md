# API Testing Directory

This directory contains all resources related to API testing for the Canner project.

## Structure

- [postman/](file:///C:/Project/OpenSource/canner/api-testing/postman) - Postman collections, test data, and documentation
  - [collection.json](file:///C:/Project/OpenSource/ccanner/api-testing/postman/collection.json) - Main Postman collection for testing all API endpoints
  - [test_data.json](file:///C:/Project/OpenSource/canner/api-testing/postman/test_data.json) - Test data file formatted for Postman collection runs

## Usage

1. **Online Postman Workspace**: Access the collection directly in Postman:
   - [Canner API Collection](https://www.postman.com/enigma-8807/workspace/canner-api/collection/18089525-ea5530d5-ccc1-42e2-aa48-810acb52ef87?action=share&creator=18089525&active-environment=18089525-6b2217b0-392b-4c19-a32e-c1a54c921099)

2. **Local Import**: Import the Postman collection into Postman:
   - Open Postman
   - Click "Import" and select [collection.json](file:///C:/Project/OpenSource/canner/api-testing/postman/collection.json)

3. **Automated Response ID Handling**: The collection includes automatic handling of dynamic response IDs:
   - The "Create Response and Set ID" request automatically captures and stores the response ID
   - All subsequent requests (Get, Update, Delete) use the captured ID automatically
   - No manual ID management required during testing workflows

4. Use the [test_data.json](file:///C:/Project/OpenSource/canner/api-testing/postman/test_data.json) file for collection runs or individual requests

## Purpose

This organization helps keep all API testing resources in one place, making it easier to:

- Onboard new team members
- Maintain consistent testing procedures
- Version control testing resources
- Share testing setups across environments
- Automate API testing with dynamic ID handling
