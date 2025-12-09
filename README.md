# Clintonville Real Estate Investment Map

A comprehensive real estate investment platform for Clintonville, Ohio, featuring interactive parcel mapping, property valuations, and collaborative note-taking capabilities.

## 🏠 Features

- **Interactive Mapping**: Zoom, pan, and explore Clintonville with detailed parcel visualization
- **Property Information**: View property details, zoning information, and valuation data
- **Multi-Source Valuations**: Access tax records and Zillow estimates for investment analysis
- **Collaborative Notes**: Share insights and track properties with your team
- **User Authentication**: Secure login system with role-based permissions
- **Real-time Updates**: Live collaboration using WebSocket technology
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone the repository:**
```bash
git clone <repository-url>
cd clintonville-real-estate-map
```

2. **Install frontend dependencies:**
```bash
npm install
```

3. **Start the frontend development server:**
```bash
npm start
```

4. **Set up the backend (in a new terminal):**
```bash
cd backend
npm install
npm run dev
```

5. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** for component library
- **Leaflet** for interactive mapping
- **Socket.io** for real-time collaboration

### Backend
- **Node.js** with Express
- **Socket.io** for WebSocket connections
- **CORS** enabled for cross-origin requests
- **JWT** for authentication (mock implementation)

### Key Components

- `Map.tsx` - Interactive map with parcel markers
- `PropertyInfoPanel.tsx` - Property details and valuation display
- `NotesDialog.tsx` - Collaborative note editing
- `AuthDialog.tsx` - User authentication
- `UserContext.tsx` - Authentication state management

## 📁 Project Structure

```
clintonville-real-estate-map/
├── src/
│   ├── components/
│   │   ├── ui/           # Shadcn/ui components
│   │   ├── Map.tsx       # Interactive map
│   │   ├── PropertyInfoPanel.tsx
│   │   ├── NotesDialog.tsx
│   │   ├── AuthDialog.tsx
│   │   └── UserMenu.tsx
│   ├── contexts/
│   │   └── UserContext.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── App.tsx
├── backend/
│   ├── server.js         # Express API server
│   ├── package.json
│   └── README.md
├── docker-compose.yml
├── Dockerfile.frontend
└── DEPLOYMENT.md
```

## 🗺️ Map Features

- **Clintonville Focus**: Centered on Clintonville, Ohio coordinates
- **Parcel Markers**: Clickable markers for each property
- **Zoning Visualization**: Color-coded zoning information
- **Property Popups**: Quick property information on marker click
- **Responsive Design**: Adapts to different screen sizes

## 💰 Property Information

- **Address and Zoning**: Complete property identification
- **Multiple Valuations**: Tax assessment and Zillow estimates
- **Investment Notes**: Collaborative note-taking system
- **Real-time Updates**: Live updates across all connected users

## 👥 User Management

- **Authentication**: Sign in/Sign up functionality
- **Role-based Access**: Admin, Editor, and Viewer roles
- **Session Management**: Persistent login sessions
- **User Profiles**: Name and email management

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Backend Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Docker Deployment

```bash
docker-compose up --build
```

## 🔒 Security

- **HTTPS**: Required for production deployment
- **Environment Variables**: Secure configuration management
- **Input Validation**: Server-side validation for all inputs
- **CORS**: Configured for secure cross-origin requests

## 📊 Data Sources

- **Tax Records**: Property assessment data
- **Zillow API**: Market valuation estimates
- **OpenStreetMap**: Base map tiles
- **Custom Data**: Property-specific information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Review the backend [README.md](./backend/README.md) for API documentation
- Open an issue for bugs or feature requests

## 🎯 Roadmap

- [ ] Real parcel data integration
- [ ] Advanced filtering and search
- [ ] Property comparison tools
- [ ] Investment analysis calculators
- [ ] Mobile app development
- [ ] Advanced user permissions
- [ ] Data export functionality
- [ ] Integration with MLS systems

---

Built with ❤️ for Clintonville real estate investors








