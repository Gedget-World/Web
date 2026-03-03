// import MarkdownEditor from "@/components/markdown-editor";
import { Button } from "@/components/ui/button";

export default async function PoliciesEdit() {
  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Shipping Policy</h1>
        <Button variant="default" size={"sm"}>
          Save Changes
        </Button>
      </header>
      <main className="mt-2">
        {/* Policies list will go here */}
        {/* <MarkdownEditor /> */}
      </main>
    </div>
  );
}
