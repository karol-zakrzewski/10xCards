import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GenerateFlashcardsView = () => {
  return (
    <section className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generowanie fiszek</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Widok generowania zostanie uzupełniony w kolejnych krokach wdrożenia.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled>Generuj</Button>
            <Button variant="outline" disabled>
              Wyczyść
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default GenerateFlashcardsView;
