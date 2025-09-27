fetch('http://localhost:5000/api/todos')
    .then(res => res.json())
    .then(data => {
        // data có thể là { todos: [...], pagination: {...} }
        const todos = data.todos || data; // fallback nếu trả về mảng trực tiếp
        const list = document.getElementById('todo-list');
        if(list) {
            list.innerHTML = todos.map(todo => `<div>${todo.title}</div>`).join('');
        }
    })
    .catch(err => console.error(err));
