/**
 * Unit tests for use-media.ts helper functions.
 *
 * Supabase is mocked — these tests validate pure logic:
 *   - File extension allowlist / rejection
 *   - deleteMediaItem order of operations (DB first, then Storage)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock tracking — vi.hoisted ensures these exist before vi.mock factories run
// ---------------------------------------------------------------------------
const { mockUpload, mockRemove, mockGetPublicUrl, mockFrom } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockRemove: vi.fn(),
  mockGetPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/test.jpg" } })),
  mockFrom: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => {
  const storage = {
    from: () => ({
      upload: mockUpload,
      remove: mockRemove,
      getPublicUrl: mockGetPublicUrl,
    }),
  };
  const supabase = {
    storage,
    from: mockFrom,
  };
  return { supabase };
});

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------
import { uploadMediaItem, deleteMediaItem } from "./use-media";

// ---------------------------------------------------------------------------
// Helpers to configure mock chains
// ---------------------------------------------------------------------------
function setupDefaultChain() {
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockSingle = vi.fn().mockResolvedValue({
    data: { id: "ok", media_type: "image", public_url: "u", storage_path: "p", display_order: 1, is_active: true, created_at: "" },
    error: null,
  });
  const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockSelect = vi.fn().mockReturnValue({ order: mockOrder, eq: mockEq });
  const mockInsert = vi.fn().mockReturnValue({ select: () => ({ single: mockSingle }) });
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
  });

  return { mockEq, mockSingle, mockLimit, mockOrder, mockSelect, mockInsert, mockDelete, mockUpdate };
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDefaultChain();
  mockUpload.mockResolvedValue({ error: null });
  mockRemove.mockResolvedValue({ error: null });
});

// ---------------------------------------------------------------------------
// uploadMediaItem — extension allowlist
// ---------------------------------------------------------------------------
describe("uploadMediaItem", () => {
  it("should reject files with disallowed extensions", async () => {
    const file = new File(["data"], "malware.exe", { type: "application/x-msdownload" });
    await expect(uploadMediaItem(file)).rejects.toThrow("Tipo de archivo no permitido: .exe");
  });

  it("should reject files with no extension", async () => {
    const file = new File(["data"], "noext", { type: "application/octet-stream" });
    await expect(uploadMediaItem(file)).rejects.toThrow("Tipo de archivo no permitido");
  });

  it("should reject .svg files", async () => {
    const file = new File(["<svg>"], "image.svg", { type: "image/svg+xml" });
    await expect(uploadMediaItem(file)).rejects.toThrow("Tipo de archivo no permitido: .svg");
  });

  it.each(["jpg", "jpeg", "png", "gif", "webp", "avif", "mp4", "webm"])(
    "should accept .%s files",
    async (ext) => {
      const file = new File(["data"], `test.${ext}`, {
        type: ext === "mp4" || ext === "webm" ? `video/${ext}` : `image/${ext}`,
      });
      const result = await uploadMediaItem(file);
      expect(result.id).toBe("ok");
    }
  );
});

// ---------------------------------------------------------------------------
// deleteMediaItem — order of operations
// ---------------------------------------------------------------------------
describe("deleteMediaItem", () => {
  it("should delete from DB before Storage", async () => {
    const callOrder: string[] = [];

    const mockDeleteEq = vi.fn().mockImplementation(() => {
      callOrder.push("db_delete");
      return Promise.resolve({ error: null });
    });
    mockRemove.mockImplementation(() => {
      callOrder.push("storage_remove");
      return Promise.resolve({ error: null });
    });
    mockFrom.mockReturnValue({
      delete: () => ({ eq: mockDeleteEq }),
    });

    await deleteMediaItem("item-1", "path/to/file.jpg");
    expect(callOrder).toEqual(["db_delete", "storage_remove"]);
  });

  it("should throw on DB delete error without calling Storage", async () => {
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: { message: "DB error" } });
    mockFrom.mockReturnValue({
      delete: () => ({ eq: mockDeleteEq }),
    });

    await expect(deleteMediaItem("item-1", "path/to/file.jpg")).rejects.toEqual({ message: "DB error" });
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
