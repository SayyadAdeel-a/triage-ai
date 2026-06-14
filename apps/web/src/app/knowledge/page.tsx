import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { AddRuleForm } from "./add-rule-form";
import { AddBulkKnowledgeForm } from "./add-bulk-knowledge-form";
import { deleteRuleAction, deleteKnowledgeAction } from "../actions";

export default async function KnowledgePage() {
  const [rules, knowledgeBase] = await Promise.all([
    prisma.rule.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.knowledge.findMany({ orderBy: { createdAt: 'desc' } })
  ]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center py-4 px-4 sm:px-6 lg:px-8">
      <Nav />
      
      <div className="w-full max-w-4xl mt-4 space-y-12">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Settings & Context</h1>
          <p className="mt-2 text-lg text-gray-500">Train your AI with instructions and bulk knowledge.</p>
        </header>

        {/* --- RULES SECTION --- */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Instructions (Rules)</h2>
              <p className="text-sm text-gray-500">These rules are applied to 100% of emails. Use this for tone, formatting, and signatures.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Rule</h3>
            <AddRuleForm />
          </div>

          <div className="space-y-3">
            {rules.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border p-4 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap text-sm">{item.content}</p>
                </div>
                <form action={async () => { "use server"; await deleteRuleAction(item.id); }}>
                  <button type="submit" className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-md text-sm transition-colors">Delete</button>
                </form>
              </div>
            ))}
            {rules.length === 0 && <p className="text-center text-gray-500 py-4">No instructions added yet.</p>}
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* --- KNOWLEDGE BASE SECTION --- */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bulk Knowledge (RAG)</h2>
              <p className="text-sm text-gray-500">Paste huge documents here. They will be chunked, vectorized, and automatically retrieved only when needed.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <AddBulkKnowledgeForm />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 px-2">Indexed Snippets ({knowledgeBase.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledgeBase.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm truncate" title={item.title}>{item.title}</h4>
                    <p className="text-gray-500 mt-2 text-xs line-clamp-3">{item.content}</p>
                  </div>
                  <form action={async () => { "use server"; await deleteKnowledgeAction(item.id); }} className="self-end">
                    <button type="submit" className="text-red-500 hover:bg-red-50 px-2 py-1 rounded-md text-xs transition-colors">Delete</button>
                  </form>
                </div>
              ))}
            </div>
            {knowledgeBase.length === 0 && <p className="text-center text-gray-500 py-4">No knowledge chunks indexed.</p>}
          </div>
        </section>

      </div>
    </div>
  );
}
