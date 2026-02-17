# Luban Workshop Restaurant Website

A modern, responsive website for Luban Workshop restaurant, featuring a digital menu, table reservation system, and comprehensive information about our culinary services.

## Features

- **Home Page**: Welcoming hero section with call-to-action
- **About Us**: Information about our restaurant philosophy and values
- **Menu**: Comprehensive menu organized by categories (Appetizers, Main Courses, Desserts, Drinks)
- **Reservation System**: Online table booking with form validation
- **Contact Information**: Opening hours, location, and contact details
- **Responsive Design**: Mobile-friendly with collapsible navigation

## Getting Started

Simply open `index.html` in your web browser to view the website.

### Local Development

To run a local server:

```bash
# Using Python 3
python3 -m http.server 8080

# Then visit http://localhost:8080 in your browser
```

## Technologies Used

- HTML5
- CSS3 (Flexbox, Grid, Custom Properties)
- Vanilla JavaScript (no frameworks)

## Project Structure

```
luban-workshop/
├── index.html      # Main HTML file with all sections
├── styles.css      # Complete styling and responsive design
├── script.js       # Interactive features and form validation
└── README.md       # This file
```

## Features in Detail

### Navigation
- Sticky navigation bar
- Smooth scrolling to sections
- Mobile-responsive hamburger menu

### Menu
- 4 categories: Appetizers, Main Courses, Desserts, Drinks
- Each item includes name, price, and description
- Hover effects for better UX

### Reservation Form
- Required fields: Name, Date, Time, Party Size
- Optional fields: Email, Phone, Special Requests
- Form validation (prevents past dates)
- Success confirmation message

### Contact Section
- Detailed opening hours
- Location information
- Map placeholder for future integration

## Browser Compatibility

Works on all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## License

All rights reserved © 2024 Luban Workshop
