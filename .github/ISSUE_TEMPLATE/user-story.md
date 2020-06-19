---
name: User Story
about: Register a user story
title: 'API Consumer can register a new User '
labels: story
assignees: ''

---

### Description
As a API Consumer
I want to register a new user
So that I can send a email and wait for activation request from the user

#### Acceptance Criteria
- When Consumer tries to register
 `POST /users`
- then the users module will validate if the body has all required fields.
- If the the passwords match
- and if the email is available
- will create a new activation token
- sent the activation link to the email passed by the user
- and will return a **201 Created**

When I see the **201 Created**, I also want to see the respones body with the user as described below.

#### Request Body
```json
{
  "name": "Junior Mendes",
  "email": "jm@test.com",
  "password": "m3$3jdiii32-asdasd"
  "passwordConfirmation": "m3$3jdiii32-asdasd"
}
```
#### Response Body
```json
{
  "name": "Junior Mendes",
  "email": "jm@test.com",
  "isActive": false,
  "createdAt": "2020-06-15T22:28:37.348Z",
  "updatedAt": "2020-06-15T22:28:37.348Z"
}
```
