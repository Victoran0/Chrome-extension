const API_KEY = 'sk-hidden'

const fetchData = async() => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: "Hello!"
            }]
        })
    })
    const data = await response.json()
    console.log(data)
}

fetchData()