const API_URL = 'http://163.180.179.165:5000'; // Replace with your Flask backend URL

export async function fetchData(endpoint) {
    const url = `${API_URL}/${endpoint}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

export async function postData(endpoint, data) {
    const url = `${API_URL}/${endpoint}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error posting data:', error);
        throw error;
    }
}