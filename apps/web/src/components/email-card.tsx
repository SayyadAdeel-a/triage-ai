"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface EmailData {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  summary: string;
  category: string;
  draftReply?: string;
  confidenceScore?: number;
  priority?: number;
  replyNeeded?: boolean;
  time: string;
}

export function EmailCard({ email, allCategories = [] }: { email: EmailData, allCategories?: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsUpdating(true);
    try {
      const { reCategorizeEmailAction } = await import('@/app/actions');
      await reCategorizeEmailAction(email.id, e.target.value);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{email.subject}</CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-gray-700">{email.senderName}</span> &lt;{email.senderEmail}&gt; • {email.time}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {email.confidenceScore !== undefined && (
                <div className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full" title="AI Confidence Score">
                  <div className={`w-2 h-2 rounded-full mr-1 ${email.confidenceScore > 90 ? 'bg-green-500' : email.confidenceScore > 75 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  {email.confidenceScore}%
                </div>
              )}
              {email.priority !== undefined && (
                <div className="flex items-center text-xs font-semibold text-gray-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100" title={`Priority: ${email.priority}/5`}>
                  ⚡ {email.priority}/5
                </div>
              )}
              {email.replyNeeded && (
                <div className="flex items-center text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100" title="Human expects a reply">
                  ✉️ Needs Reply
                </div>
              )}
              <select 
                disabled={isUpdating}
                value={email.category} 
                onChange={handleCategoryChange}
                className={`text-xs font-semibold border-none bg-gray-100 rounded-md px-2 py-1 cursor-pointer focus:ring-2 focus:ring-blue-500 ${
                  email.category === "Needs Reply" ? "text-red-700 bg-red-100" : 
                  email.category === "Important" ? "text-blue-700 bg-blue-100" : 
                  "text-gray-700 bg-gray-100"
                }`}
              >
                <option value={email.category}>{email.category}</option>
                {allCategories.filter(c => c !== email.category).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 text-sm text-blue-800 font-medium mb-3">
          ✨ {email.summary}
        </div>
        
        {email.draftReply && (
          <div className="mt-4">
            {expanded ? (
              <div className="bg-gray-50 p-4 rounded-md border text-sm">
                <div className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Draft Reply</div>
                <div className="whitespace-pre-wrap">{email.draftReply}</div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => navigator.clipboard.writeText(email.draftReply!)}>Copy Draft</Button>
                  <Button size="sm" variant="outline" onClick={() => setExpanded(false)}>Hide</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setExpanded(true)}>
                View Draft Reply
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
