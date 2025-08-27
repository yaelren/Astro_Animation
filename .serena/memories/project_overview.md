# AstroDemo Project Overview

## Project Purpose
Interactive React application featuring Astro, an animated chat assistant character that responds to user interactions with sophisticated animations. Combines React-based movement with Rive state machine animations.

## Tech Stack
- **Framework**: React 18 with Create React App
- **Animation**: Rive (with React canvas and WebGL support)
- **Language**: TypeScript/JavaScript
- **Build**: React Scripts
- **Dependencies**: @rive-app/react-canvas, @rive-app/react-webgl, @rive-app/react-webgl2

## Project Structure
- **src/App.js**: Main orchestration component
- **src/Astro.js**: Animated character controller with lifecycle methods
- **src/ChatMock.js**: Chat interface simulation
- **src/style.css**: Application styling
- **ASTRO_DESIGN_DOC.md**: Comprehensive character interaction system design

## Key Features
- Interactive animated character (Astro)
- Two-layer animation system (React movement + Rive states)  
- Chat simulation with real-time interactions
- Eye tracking and caret position following
- Multiple animation states and transitions
- Blue trail effect during movement