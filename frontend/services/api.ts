import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: "https://gradewizard.onrender.com",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,  // CORS sorunlarını önlemek için
});

export const api = {
    async get(endpoint: string) {
        const response = await axiosInstance.get(endpoint);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.data;
    },

    async post(endpoint: string, data: any) {
        const response = await axiosInstance.post(endpoint, data);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.data;
    }
};

export const quizApi = {
    async fetchQuizQuestion(language: string = 'en') {
        try {
            const response = await axios.get(`https://gradewizard-1.onrender.com/generate_quiz`, {
                params: { language }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching quiz:', error);
            throw error;
        }
    }
};
