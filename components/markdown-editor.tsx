"use client";

import React, { useState } from "react";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";

export default function MarkdownEditor() {
  const [text, setText] = useState("# Hello Editor");
  return (
    <MdEditor
      value={text}
      onChange={setText}
      language="en-US"
      style={{
        borderColor: "#d1d5db",
      }}
    />
  );
}
