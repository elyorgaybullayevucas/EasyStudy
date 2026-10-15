package uz.easystudy.ai;

import org.springframework.core.io.Resource;

/** Speaking audio -> matn. */
public interface Transcriber {
    /** @return transkript yoki null (provayder yo'q / xato) */
    String transcribe(Resource audio, String filename, String language);

    boolean available();
}
