"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  name?: string;
};

export function Select({ value, onChange, options, placeholder = "Select…", disabled, name }: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Defense against label-ancestor re-open:
   * When an option is selected via pointerdown, we set this flag so the
   * trigger's own click handler (fired by the label's synthetic forwarding)
   * is ignored for one cycle.
   */
  const suppressToggleRef = useRef(false);

  const selected = options.find((o) => o.value === value);

  /* Close on outside pointerdown */
  useEffect(() => {
    if (!open) return;
    function onOutside(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /**
   * Called when user presses down on an option.
   * Using pointerdown (fires before click/mousedown) means we close the
   * dropdown and set the suppress flag *before* any label-forwarded click
   * can reach the trigger button.
   */
  function handleOptionPointerDown(e: React.PointerEvent, optionValue: string) {
    e.preventDefault(); // prevent focus shift & suppress subsequent click
    suppressToggleRef.current = true;
    onChange(optionValue);
    setOpen(false);
    // Reset after two animation frames (safely past any synthetic click)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        suppressToggleRef.current = false;
      })
    );
  }

  function handleTriggerClick() {
    if (suppressToggleRef.current) return;
    setOpen((prev) => !prev);
  }

  return (
    /* stopPropagation prevents click from reaching any <label> ancestor */
    <div
      ref={containerRef}
      style={{ position: "relative", marginTop: 6 }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={handleTriggerClick}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          border: `2px solid ${open ? "var(--accent)" : "var(--ink)"}`,
          borderRadius: "var(--radius-md)",
          background: "transparent",
          color: selected ? "var(--ink)" : "var(--ink-faint)",
          padding: "10px 12px",
          fontFamily: "inherit",
          fontSize: "0.94rem",
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
          minHeight: 44,
          textAlign: "left",
          boxShadow: open ? "0 0 0 2px rgba(243,156,18,0.18)" : undefined,
          transition: "border-color 0.15s, box-shadow 0.15s"
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          style={{
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--ink-soft)"
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#fff",
            border: "2px solid var(--ink)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 8px 30px rgba(10,42,63,0.14)",
            overflow: "hidden",
            animation: "asg-fade-in 0.15s cubic-bezier(0.22,1,0.36,1) both"
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                /* pointerDown fires before click — closes immediately */
                onPointerDown={(e) => handleOptionPointerDown(e, option.value)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "11px 14px",
                  border: "none",
                  borderBottom: "1.5px solid rgba(10,42,63,0.08)",
                  background: isSelected ? "rgba(243,156,18,0.08)" : "#fff",
                  color: isSelected ? "var(--accent)" : "var(--ink)",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  fontWeight: isSelected ? 800 : 700,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s, color 0.12s",
                  boxShadow: "none",
                  minHeight: 0,
                  borderRadius: 0
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(10,42,63,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = isSelected
                    ? "rgba(243,156,18,0.08)"
                    : "#fff";
                }}
              >
                {option.label}
                {isSelected && (
                  <Check size={15} strokeWidth={3} style={{ color: "var(--accent)", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
