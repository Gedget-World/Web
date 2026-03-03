"use client";

import React, { useState } from "react";

export default function MarkdownEditor() {
  const [text, setText] = useState("# Hello Editor");
  return <div className="border rounded-lg">Editor</div>;
}
