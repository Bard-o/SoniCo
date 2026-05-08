import { useState } from "react";
import { supabase, supabaseUrl, MEDIA_BUCKET } from "@/lib/supabase";
import { MAX_PHOTO_SIZE_MB, ACCEPTED_PHOTO_TYPES } from "@/config/constants";
import { useToast } from "./use-toast";

const MAX_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

/** Extract the bucket-relative path from a public Storage URL. */
function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const prefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;
  return publicUrl.startsWith(prefix) ? publicUrl.slice(prefix.length) : null;
}

export function usePhotoUpload(bucket: string = MEDIA_BUCKET) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const upload = async (file: File, pathPrefix: string): Promise<string> => {
    setError(null);

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      const msg = `Archivo muy grande (máx ${MAX_PHOTO_SIZE_MB} MB)`;
      setError(msg);
      toast({ title: "Error de subida", description: msg, variant: "destructive" });
      throw new Error(msg);
    }

    // Validate type
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type as typeof ACCEPTED_PHOTO_TYPES[number])) {
      const msg = "Formato no soportado. Usa JPEG, PNG o WebP.";
      setError(msg);
      toast({ title: "Error de subida", description: msg, variant: "destructive" });
      throw new Error(msg);
    }

    setIsUploading(true);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${pathPrefix}/${Date.now()}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, file, { upsert: true });

    if (uploadError) {
      const msg = uploadError.message;
      setError(msg);
      toast({ title: "Error de subida", description: msg, variant: "destructive" });
      setIsUploading(false);
      throw new Error(msg);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    setIsUploading(false);
    return urlData.publicUrl;
  };

  /** Delete a photo from the storage bucket by its public URL. */
  const remove = async (publicUrl: string): Promise<void> => {
    const path = extractStoragePath(publicUrl, bucket);
    if (!path) return; // Not a storage URL (e.g. blob), nothing to delete

    const { error: removeError } = await supabase.storage.from(bucket).remove([path]);
    if (removeError) {
      console.error("[PhotoUpload] Delete error:", removeError.message);
    }
  };

  return { upload, isUploading, error, remove };
}
