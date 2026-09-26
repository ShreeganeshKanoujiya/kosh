"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, ApiClientError, errorMessage } from "@/lib/api-client";
import type { SheetsConnectionDTO } from "@/types/dto";
import { CopyButton } from "./copy-button";

/** Connect the company's Google Sheet: share it with the service account, paste the link. */
export function GoogleSheetsSection({ initial }: { initial: SheetsConnectionDTO }) {
  const me = useSession();
  const canEdit = me.can("settings.update");
  const [connection, setConnection] = useState(initial);
  const [editing, setEditing] = useState(!initial.spreadsheetId);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  if (!connection.configured) {
    return (
      <p className="text-sm text-muted-foreground">
        Google Sheets export isn&apos;t set up on this server yet. Whoever hosts Kosh for your company needs to add a Google service account first.
      </p>
    );
  }

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { data, message } = await api<SheetsConnectionDTO>("/api/google-sheets/connection", { method: "PUT", body: { url } });
      setConnection(data);
      setEditing(false);
      setUrl("");
      toast.success(`${message ?? "Connected"} ✓`);
    } catch (err) {
      const fieldError = err instanceof ApiClientError ? err.fieldErrors.url?.[0] : undefined;
      if (fieldError) setError(fieldError);
      else toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    try {
      const { data } = await api<SheetsConnectionDTO>("/api/google-sheets/connection", { method: "DELETE" });
      setConnection(data);
      setEditing(true);
      toast.success("Google Sheet disconnected");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      {connection.spreadsheetUrl && !editing && (
        <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Connected</p>
            <p className="text-caption">Each export is added to this sheet as a new tab.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href={connection.spreadsheetUrl} target="_blank" rel="noopener noreferrer">
                Open sheet
                <ExternalLink />
              </a>
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Change
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDisconnect(true)}>
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {editing && canEdit && (
        <ol className="space-y-5 text-sm">
          <li className="space-y-1">
            <p className="font-medium">1. Create a Google Sheet</p>
            <p className="text-muted-foreground">Or open an existing one your accountant uses.</p>
          </li>
          <li className="space-y-2">
            <p className="font-medium">2. Share it with Kosh as an Editor</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs break-all">{connection.serviceAccountEmail}</code>
              <CopyButton value={connection.serviceAccountEmail ?? ""} label="Copy email" />
            </div>
          </li>
          <li>
            <form onSubmit={connect} noValidate>
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="sheetUrl" className="font-medium">
                  3. Paste the sheet&apos;s link
                </FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="sheetUrl"
                    type="url"
                    inputMode="url"
                    placeholder="https://docs.google.com/spreadsheets/d/…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    aria-invalid={!!error}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving || !url.trim()}>
                      {saving && <Spinner />}
                      Connect
                    </Button>
                    {connection.spreadsheetId && (
                      <Button type="button" variant="ghost" onClick={() => (setEditing(false), setError(null))}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                <FieldDescription>Kosh checks it can open the sheet before saving.</FieldDescription>
                <FieldError>{error}</FieldError>
              </Field>
            </form>
          </li>
        </ol>
      )}

      {!connection.spreadsheetId && !canEdit && <p className="text-sm text-muted-foreground">No Google Sheet is connected. An admin can connect one here.</p>}

      <p className="text-caption">
        Google Sheets is a copy for reporting and sharing — Kosh remains the source of truth. Exports never change or delete existing tabs.
      </p>

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Disconnect Google Sheet?"
        description="Exports to Google Sheets stop until a sheet is connected again. Tabs already in the sheet stay there."
        confirmLabel="Disconnect"
        destructive
        onConfirm={disconnect}
      />
    </div>
  );
}
