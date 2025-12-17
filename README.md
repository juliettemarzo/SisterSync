# SisterSync

SisterSync is a full-stack web application designed to streamline and secure the Big/Little matching process for sorority organizations. The platform centralizes user profiles and matching data, making the process more efficient, organized, and fair.

This project was developed as a group assignment for a Villanova Senior Projects course.

## Features

* Secure user authentication using Firebase Authentication
* User profile creation and management
* Centralized data storage with Firebase Firestore
* Responsive front-end built with React
* JavaScript algorithm to match bigs and littles by preference
* Role Based Access Control implementation allowing New Member Educators to access and modify pairings

## Tech Steck

* Frontend: React
* Backend: Node.js
* Database: Firebase Firestore
* Authentication: Firebase Auth
* Hosting: npm

## My Contributions

* Designed and implemented the core matching algorithm used to generate Big/Little pairings based on user rankings and constraints
* Built key sign-up and onboarding features, ensuring a smooth and secure user experience
* Implemented role-based functionality allowing New Member Educators to view, edit, and manage pairing results
* Developed and integrated the Edit Rankings feature, enabling users to update preferences dynamically
* Ensured correct functionality of pause voting, preventing ranking changes during restricted periods
* Refined and debugged HTML/CSS to improve layout consistency, responsiveness, and overall UI quality
* Collaborated with team members using GitHub pull requests, issue tracking, and code reviews

## Matching Algorithm Overview
SisterSync uses a custom matching algorithm to generate Big/Little pairings based on ranked user preferences while respecting administrative constraints.

Participants submit ranked preferences, which are processed once voting is complete. The algorithm evaluates mutual rankings to create optimal pairings, prioritizing higher mutual preference matches. Safeguards such as pause voting ensure rankings cannot be modified during restricted periods, preserving data integrity.

New Member Educators are able to review and adjust generated pairings through role-based access controls, allowing for human oversight when needed.

The final output is a set of pairings that balances fairness, preference alignment, and administrative flexibility.

# Getting Started

## Prerequisites
* Node.js (v16 or newer)
* npm
* A firebase project

## Installation

1. Clone the repository
2. Install dependencies:
   ```npm install```
3. Configure Firebase:
    * Create a Firebase project
    * Enable Authentication and Firestore
    * Add your Firebase configuration to the project’s Firebase configuration file

4. Start the application: ```npm start```
5. Open your browser and navigate to: ```http://localhost:3000/```

    ** Note: Firebase configuration values are required to run the application but are not included in this repository for security reasons.

Developed by Juliette Marzo, Madison Guarin, Charlotte McClelland, and Peter Chiu with additional contributions by Emily Amirata. 
<br>Special thank you to Professor Obermyer for her guidance throughout this project.
