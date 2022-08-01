/* eslint-disable */
export const displayMap = (locations) => {
    
    
    mapboxgl.accessToken = 'pk.eyJ1IjoiYnJpeHRvbm1hcGJveCIsImEiOiJjbDV6OXRzbjcwZjA3M2ZxaXE4NHV1ZWpmIn0.R5N392hS_2BVkR2yUEJMJg';
    var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/brixtonmapbox/cl5za7t2m000m15lbf7zu53n8',
      center: [-118.113491,34.111745]
    });
    
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(location => {
        
        const el = document.createElement('div');
        el.className = 'marker';
    
        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(location.coordinates).addTo(map)
    
        // Add popup
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(location.coordinates).setHTML(`<p>Day ${location.day}: ${location.description}</p>`).addTo(map)
    
        // Extend map bounds to include current location
        bounds.extend(location.coordinates)
    });
    
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    })
}
