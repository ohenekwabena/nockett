"use client";

import { useState } from "react";
import { referenceDescriptors, type ReferenceDescriptor } from "@/components/reference-list/descriptor";
import { useReferenceList, type ReferenceListController } from "@/components/reference-list/use-reference-list";
import { Btn, ConfirmDialog, IconBtn, MIcon, Modal } from "@/components/nk/ui";

/** Design icon per reference list key (design data.js ENTITY_META). */
const ENTITY_ICONS: Record<string, string> = {
  categories: "category",
  priorities: "signal_cellular_alt",
  assignees: "group",
  departments: "domain",
  demarcation: "border_vertical",
  link: "cable",
  site: "location_on",
  "service-type": "lan",
  "detection-source": "radar",
  "traffic-impact": "traffic",
};

function EntityModal({
  descriptor,
  controller,
  onClose,
}: {
  descriptor: ReferenceDescriptor;
  controller: ReferenceListController;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const add = async () => {
    if (!draft.trim()) return;
    if (await controller.create(draft)) setDraft("");
  };

  const confirmItem = controller.items.find((item) => item.id === confirmId);

  return (
    <Modal
      open
      onClose={onClose}
      title={"Manage " + descriptor.title}
      subtitle={descriptor.description || `Create, edit, and delete ${descriptor.plural}.`}
      width={460}
    >
      <div className="ent-add">
        <input
          className="input"
          placeholder={`Enter ${descriptor.singular} name`}
          value={draft}
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && add()}
        />
        <Btn kind="primary" small icon="add" onClick={add} disabled={!draft.trim() || controller.isMutating}>
          Add
        </Btn>
      </div>
      <div className="ent-list">
        {controller.items.map((item) => (
          <div key={item.id} className="ent-row">
            {editId === item.id ? (
              <input
                className="input"
                value={editValue}
                autoFocus
                onChange={(event) => setEditValue(event.target.value)}
                onKeyDown={async (event) => {
                  if (event.key === "Enter" && editValue.trim()) {
                    await controller.update(item.id, editValue);
                    setEditId(null);
                  }
                  if (event.key === "Escape") setEditId(null);
                }}
                onBlur={() => setEditId(null)}
              />
            ) : (
              <span className="ent-name">{item.name}</span>
            )}
            <span className="ent-actions">
              <IconBtn
                icon="edit"
                size={15}
                title="Rename"
                onClick={() => {
                  setEditId(item.id);
                  setEditValue(item.name);
                }}
              />
              <IconBtn icon="delete" size={15} title="Delete" onClick={() => setConfirmId(item.id)} />
            </span>
          </div>
        ))}
        {controller.items.length === 0 && !controller.isLoading && (
          <div className="dim" style={{ padding: 12, fontSize: 13 }}>
            No {descriptor.plural} found.
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmId != null}
        onClose={() => setConfirmId(null)}
        title={`Delete “${confirmItem?.name ?? ""}”?`}
        body={`Tickets already using this ${descriptor.singular} keep their value; it just leaves the pick lists.`}
        onConfirm={async () => {
          if (confirmId != null) await controller.remove(confirmId);
          setConfirmId(null);
        }}
      />
    </Modal>
  );
}

function EntityCard({ descriptor }: { descriptor: ReferenceDescriptor }) {
  const controller = useReferenceList(descriptor);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="ent-card" onClick={() => setOpen(true)}>
        <div className="ent-card-head">
          <span className="ent-ic">
            <MIcon name={ENTITY_ICONS[descriptor.key] || "category"} size={17} />
          </span>
          <span className="ent-title">{descriptor.title}</span>
          <span className="seg-count">{controller.isLoading ? "…" : controller.items.length}</span>
        </div>
        <div className="ent-preview">
          {controller.items.slice(0, 3).map((item) => (
            <span key={item.id} className="chip chip-soft">
              {item.name}
            </span>
          ))}
          {controller.items.length > 3 && (
            <span className="dim" style={{ fontSize: 12 }}>
              +{controller.items.length - 3} more
            </span>
          )}
        </div>
        <button type="button" className="link-btn">
          Manage <MIcon name="arrow_forward" size={13} />
        </button>
      </div>
      {open && <EntityModal descriptor={descriptor} controller={controller} onClose={() => setOpen(false)} />}
    </>
  );
}

export default function EntitiesPage() {
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title-row">
          <MIcon name="category" size={20} className="accent" fill={1} />
          <h1>Entities</h1>
        </div>
        <span className="dim" style={{ fontSize: 13 }}>
          Reference lists that power every ticket dropdown and filter
        </span>
      </div>
      <div className="ent-grid">
        {referenceDescriptors.map((descriptor) => (
          <EntityCard key={descriptor.key} descriptor={descriptor} />
        ))}
      </div>
    </div>
  );
}
