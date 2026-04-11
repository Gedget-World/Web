"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, User, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";

// Sample Q&A data - In production, this would come from the database
const sampleQuestions = [
  {
    id: "1",
    question: "Is this product compatible with all devices?",
    answer:
      "Yes, this product is universally compatible with all major devices including Android, iOS, Windows, and Mac.",
    askedBy: "Rahul K.",
    answeredBy: "Gadgets Kabila",
    date: "2 days ago",
  },
  {
    id: "2",
    question: "What is the warranty period for this product?",
    answer:
      "This product comes with a 1-year manufacturer warranty covering all manufacturing defects.",
    askedBy: "Priya S.",
    answeredBy: "Gadgets Kabila",
    date: "1 week ago",
  },
  {
    id: "3",
    question: "Does this come with a carrying case?",
    answer:
      "Yes, a premium carrying case is included in the box along with the product.",
    askedBy: "Amit P.",
    answeredBy: "Gadgets Kabila",
    date: "2 weeks ago",
  },
];

interface ProductQAProps {
  productId: string;
}

export function ProductQA({ productId }: ProductQAProps) {
  const [showAll, setShowAll] = useState(false);
  const [showAskForm, setShowAskForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const displayedQuestions = showAll
    ? sampleQuestions
    : sampleQuestions.slice(0, 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to the API
    setSubmitted(true);
    setQuestion("");
    setName("");
    setEmail("");
    setTimeout(() => {
      setSubmitted(false);
      setShowAskForm(false);
    }, 3000);
  };

  return (
    <section className="mt-12 pt-8 border-t">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-semibold text-slate-900">
            Questions & Answers
          </h2>
          <span className="text-sm text-slate-500">
            ({sampleQuestions.length})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAskForm(!showAskForm)}
        >
          Ask a Question
        </Button>
      </div>

      {/* Ask Question Form */}
      {showAskForm && (
        <Card className="p-4 mb-6 bg-slate-50 border-slate-200">
          {submitted ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-slate-900">Question Submitted!</p>
              <p className="text-sm text-slate-600">
                We'll notify you when your question is answered.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Textarea
                  placeholder="Type your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="bg-white resize-none"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white"
                  required
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAskForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Submit Question
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {displayedQuestions.map((qa) => (
          <div
            key={qa.id}
            className="border-b border-slate-100 pb-4 last:border-0"
          >
            <div className="flex gap-3">
              <div className="shrink-0">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  Q
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {qa.question}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Asked by {qa.askedBy} • {qa.date}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-3 ml-9">
              <div className="shrink-0">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  A
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{qa.answer}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Answered by {qa.answeredBy}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less */}
      {sampleQuestions.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 w-full text-slate-600"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              Show Less <ChevronUp className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              View All {sampleQuestions.length} Questions{" "}
              <ChevronDown className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      )}
    </section>
  );
}
