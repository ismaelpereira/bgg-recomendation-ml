# Board Game Recommendation System

A web application that displays user profiles and boardgames listings, with the ability to track user purchases for future machine learning recommendations using TensorFlow.js.

## Project Structure

- `index.html` - Main HTML file for the application
- `index.js` - Entry point for the application
- `view/` - Contains classes for managing the DOM and templates
- `controller/` - Contains controllers to connect views and services
- `service/` - Contains business logic for data handling
- `data/` - Contains JSON files with user and boardgames data

## Setup and Run

1. Install dependencies:

```
npm install
```

2. Start the application:

```
npm start
```

3. Open your browser and navigate to `http://localhost:8080`

## Features

- User profile selection with details display
- Favorite boardgames display
- Boardgames listing with "Add Favorite" functionality
- Favorite boardgames tracking using sessionStorage

## Future Enhancements

- TensorFlow.js-based recommendation engine
- User similarity analysis
- Boardgame recommendation based on favorite games history
- Not train the model on the Frontend and create a small API to train the model and save on a Vectorial Database to make the website faster.
- Improve the board game data adding more fields on the `bgg.json` and increase the amount of board games and users on `users.json`

_This is just a POC for study purpose_

**This repository was created based on a class ministred by [Erick Wendel](https://github.com/erickwendel).**
