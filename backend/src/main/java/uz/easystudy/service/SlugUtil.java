package uz.easystudy.service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

public final class SlugUtil {
    private SlugUtil() {}

    private static final String[][] CYRILLIC = {
            {"а","a"},{"б","b"},{"в","v"},{"г","g"},{"д","d"},{"е","e"},{"ё","yo"},{"ж","j"},{"з","z"},{"и","i"},
            {"й","y"},{"к","k"},{"л","l"},{"м","m"},{"н","n"},{"о","o"},{"п","p"},{"р","r"},{"с","s"},{"т","t"},
            {"у","u"},{"ф","f"},{"х","x"},{"ц","ts"},{"ч","ch"},{"ш","sh"},{"щ","sh"},{"ъ",""},{"ы","i"},{"ь",""},
            {"э","e"},{"ю","yu"},{"я","ya"},{"ў","o"},{"қ","q"},{"ғ","g"},{"ҳ","h"}
    };

    public static String slugify(String input) {
        String s = input.toLowerCase(Locale.ROOT).replace("'", "").replace("’", "").replace("ʻ", "");
        for (String[] pair : CYRILLIC) s = s.replace(pair[0], pair[1]);
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        s = s.replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        if (s.length() > 200) s = s.substring(0, 200);
        return s.isEmpty() ? "item" : s;
    }

    /** Band bo'lsa -2, -3 ... qo'shib noyob slug qaytaradi. */
    public static String unique(String base, Predicate<String> exists) {
        String slug = slugify(base);
        String candidate = slug;
        int i = 2;
        while (exists.test(candidate)) candidate = slug + "-" + i++;
        return candidate;
    }
}
