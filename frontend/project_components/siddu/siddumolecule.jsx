"use client";
import React, { useState } from "react";

const Siddumolecule = () => {
  const [text, setText] = useState("");
  const [radio, setRadio] = useState("a");

  return (
    <div>
      <h2>Siddumolecule Component</h2>

      <div className="max-w-560">
        <div className="mb-2">
          <label className="d-block mb-1">Search</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something..."
            className="form-control w-100"
          />
        </div>

        <div className="mb-2">
          <label className="d-block mb-1">Choose option</label>
          <label className="me-3">
            <input
              type="radio"
              name="siddu-radio"
              value="a"
              checked={radio === "a"}
              onChange={() => setRadio("a")}
            />
            {' '}Option A
          </label>
          <label>
            <input
              type="radio"
              name="siddu-radio"
              value="b"
              checked={radio === "b"}
              onChange={() => setRadio("b")}
            />
            {' '}Option B
          </label>
        </div>

        <div className="mt-3">
          <strong>Current state</strong>
          <div>Text: {text || <em>(empty)</em>}</div>
          <div>Radio: {radio}</div>
        </div>
      </div>
    </div>
  );
};

export default Siddumolecule;
