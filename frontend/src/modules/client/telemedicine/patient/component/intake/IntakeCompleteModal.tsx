/**
 * IntakeCompleteModal — shown after the patient finishes an intake session.
 *
 * Layer: client / telemedicine / patient / intake
 *
 * UI shown after an encrypted MindSpace transcript has been persisted:
 *   - Large CheckCircle2 success icon in a green circle
 *   - "Intake Session Saved" title
 *   - "Maybe Later" ghost button
 */

"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

/** Props for IntakeCompleteModal. */
interface IntakeCompleteModalProps {
  /** Controls dialog visibility. */
  open: boolean;
  /** MindSpace UUID for the saved intake. */
  intakeId: string;
  /** Localised base path for returning to the member dashboard. */
  basePath: string;
}

/**
 * Post-intake completion modal.
 *
 * @param open - Whether the dialog is visible.
 * @param intakeId - The completed MindSpace intake's UUID.
 * @param basePath - Locale-prefixed base path for navigation.
 */
export function IntakeCompleteModal({ open, intakeId, basePath }: IntakeCompleteModalProps) {
  const router = useRouter();

  function handleClose() {
    router.push(basePath);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        /** Prevent accidental dismissal — force an explicit choice. */
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md border-0 shadow-dialog animate-scale-in"
      >
        <DialogHeader className="text-center sm:text-center space-y-4">
          {/* Success icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 animate-fade-in">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>

          <DialogTitle className="text-xl font-semibold text-foreground">
            Intake Session Saved
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Your transcript is encrypted and saved in your MindSpace account.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-3 sm:flex-col mt-6">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full h-11 text-muted-foreground hover:text-foreground"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
