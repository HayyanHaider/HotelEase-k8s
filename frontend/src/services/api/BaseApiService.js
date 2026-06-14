class BaseApiService {
 constructor(baseURL = '/api') {
  this.baseURL = baseURL;
 }

  getHeaders() {
   const token = sessionStorage.getItem('token');
    const headers = {
     'Content-Type': 'application/json'
   };
    
   if (token) {
    headers['Authorization'] = `Bearer ${token}`;
   }
    
   return headers;
  }

 async handleResponse(response) {
   const data = await response.json();
    
   if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
   }
    
   return data;
  }

 async get(endpoint, params = {}) {
   try {
    const queryString = new URLSearchParams(params).toString();
     const url = `${this.baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
     method: 'GET',
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
   } catch (error) {
    throw new Error(`GET request failed: ${error.message}`);
   }
  }

 async post(endpoint, data = {}) {
   try {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
     method: 'POST',
      headers: this.getHeaders(),
     body: JSON.stringify(data)
    });
    
    return await this.handleResponse(response);
   } catch (error) {
    throw new Error(`POST request failed: ${error.message}`);
   }
  }

 async put(endpoint, data = {}) {
   try {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
     method: 'PUT',
      headers: this.getHeaders(),
     body: JSON.stringify(data)
    });
    
    return await this.handleResponse(response);
   } catch (error) {
    throw new Error(`PUT request failed: ${error.message}`);
   }
  }

 async delete(endpoint) {
   try {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
     method: 'DELETE',
      headers: this.getHeaders()
    });
    
    return await this.handleResponse(response);
   } catch (error) {
    throw new Error(`DELETE request failed: ${error.message}`);
   }
  }
}

export default BaseApiService;
