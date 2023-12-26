"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

type pageProps = {};

const DocumentPage: React.FC<pageProps> = () => {
  const router = useRouter();
  const { user } = useUser();

  // TODO: Create a new note

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Image
        src="/empty/empty-light.png"
        height="300"
        width="300"
        alt="Empty"
        className="dark:hidden"
      />
      <Image
        src="/empty/empty-dark.png"
        height="300"
        width="300"
        alt="Empty"
        className="hidden dark:block"
      />
      <h2 className="text-lg font-medium">
        {`Welcome to ${user?.firstName}' Motion`}
      </h2>
      <Button onClick={() => {}}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Create a note
      </Button>
    </div>
  );
};
export default DocumentPage;
