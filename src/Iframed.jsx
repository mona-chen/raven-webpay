/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { createPortal } from 'react-dom';

function IFrame({ children }) {
    const [ref, setRef] = useState();
    const container = ref?.contentWindow?.document?.body;
  
    const style = {  
    display: "block",
    height: "100vh",
    width: "100vw",   
    border: "none",
    }
    return (
      <iframe style={style}  ref={setRef}>
        {container && createPortal(children, container)}
      </iframe>
    );
  }




export default IFrame