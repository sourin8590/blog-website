import React, { useState, useContext, useEffect } from "react";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import { UserContext } from "../context/userContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{'list':'ordered'}, {'list' : 'bullet'}, {'indent':'-1'}, {'indent': '+1'}],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline' ,' strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image'
]

const POST_CATEGORIES = ["Agriculture", "Business" ," Education", "Entertainment", "Art", "Investment", "Uncategorized", "Weather"]

const EditPost = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [error, setError] = useState("");

  const {currentUser} = useContext(UserContext);
  const token = currentUser?.token;
  const navigate = useNavigate();
  const {id} = useParams();

  // redirect to log in page for any user who is not logged in
  useEffect(()=>{
    if(!token){
      navigate('/login')
    }
  }, [])

  useEffect(()=>{
    const getPost = async ()=>{
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/posts/${id}`);
        // console.log(response.data);
        setTitle(response.data.title);
        setDescription(response.data.description);
        setCategory(response.data.category);
      } catch (error) {
        setError(error)
        console.log(error)
      }
    }
    getPost();

  }, []);

  const editPost = async (e)=> {
    e.preventDefault();

    const postData = new FormData();
    postData.set("title", title)
    postData.set("category", category)
    postData.set("description", description)
    postData.set("thumbnail", thumbnail)

    try {
      const response = axios.patch(`${process.env.REACT_APP_BASE_URL}/posts/${id}`, postData, {withCredentials: true, headers: {Authorization: `Bearer ${token}`}});
      if((await response).status == 200){
        return navigate('/');
      }
    } catch (error) {
      setError(error.response.data.message);
    }
  }

  return (
    <section className="create-post">
      <div className="container">
        <h2>Edit Post</h2>
        {error && <p className="form__error-message">{error}</p>}
        <form className="form create-post__form" onSubmit={editPost}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            id=""
          >
            {
              POST_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)
            }
          </select>
            <ReactQuill modules={modules} formats={formats} value={description} onChange={setDescription}/>
            <input type="file" onChange={e => setThumbnail(e.target.files[0])} accept="png, jpg, jpeg"/>
            <button type="submit" className="btn primary">Update</button>
        </form>
      </div>
    </section>
  );
};

export default EditPost;
