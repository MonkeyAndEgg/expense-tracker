import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const LOGIN_SESSION_KEY = "supabaseSession";

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("out");
  const [editingExpense, setEditingExpense] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(null); 


  useEffect(() => {
    loadSessionInfo();
    fetchExpenses();
  }, []);

  const loadSessionInfo = () => {
    const sessionData = JSON.parse(localStorage.getItem(LOGIN_SESSION_KEY));
    setSession(sessionData);
  }

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      if (data.session) {
        localStorage.setItem(LOGIN_SESSION_KEY, JSON.stringify(data.session));
      }
      setMessage('Logged in successfully!');
      fetchExpenses();
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(error.message);
    } else {
      localStorage.setItem(LOGIN_SESSION_KEY, null);
      setSession(null);
      setMessage("");
      fetchExpenses();
    }
  };

  const fetchExpenses = async () => {
    const { data, error } = await supabase.from("expenses").select("*");
    if (!error) setExpenses(data);
  };

  const addExpense = async () => {
    if (!amount || !description || !session) return;
    const { data, error } = await supabase.from("expenses").insert([{ amount, description, type, user_id: session.user.id }]).select();
    if (error) {
      setMessage(error.message);
    } else {
      setExpenses([data[0], ...expenses]);
      setAmount("");
      setDescription("");
      setType("out");
      setMessage("");
    }
  };

  const deleteExpense = async (id) => {
    const { error } = await supabase.from("expenses").delete().match({ id });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("");
      setExpenses(expenses.filter(expense => expense.id !== id));
    }
  };

  const startEditing = (expense) => {
    setEditingExpense(expense);
    setAmount(expense.amount);
    setDescription(expense.description);
    setType(expense.type);
  };

  const saveEdit = async () => {
    await supabase.from("expenses").update({ amount, description, type }).match({ id: editingExpense.id });
    setExpenses(expenses.map(expense => 
      expense.id === editingExpense.id 
        ? { ...expense, amount, description, type }
        : expense
    ));
    setEditingExpense(null);
    setAmount("");
    setDescription("");
    setType("out");
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Expense Tracker</h1>
      <div>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
        {message && <p>{message}</p>}
      </div>
      <button onClick={handleLogout}>Logout</button>
      <div className="bg-white p-4 rounded shadow-md w-96">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        >
          <option value="out">Money Out</option>
          <option value="in">Money In</option>
        </select>
        {editingExpense ? (
          <button
            onClick={saveEdit}
            className="w-full bg-green-500 text-white py-2 rounded"
          >
            Save Edit
          </button>
        ) : (
          <button
            onClick={addExpense}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Add Expense
          </button>
        )}
      </div>
      <ul className="mt-4 w-96">
        {expenses.map((expense) => (
          <li
            key={expense.id}
            className="bg-white p-2 rounded shadow mb-2 flex justify-between items-center"
          >
            <div>
              <span className={`mr-2 ${expense.type === "out" ? "text-red-500" : "text-green-500"}`}>
                {expense.type === "out" ? "🔴" : "🟢"}
              </span>
              <span>{expense.description} - ${expense.amount}</span>
            </div>
            <div>
              <button onClick={() => deleteExpense(expense.id)} className="text-red-500 mr-2">Delete</button>
              <button onClick={() => startEditing(expense)} className="text-blue-500">Edit</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
