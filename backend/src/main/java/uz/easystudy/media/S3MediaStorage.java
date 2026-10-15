package uz.easystudy.media;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import uz.easystudy.config.AppProperties;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.Duration;

/**
 * S3-mos saqlash: MinIO, Backblaze B2, Cloudflare R2, Hetzner Object Storage, AWS S3.
 * Presigned URL lar publicEndpoint orqali imzolanadi (brauzer shu manzilga boradi).
 */
public class S3MediaStorage implements MediaStorage {

    private final S3Client client;
    private final S3Presigner presigner;
    private final String bucket;

    public S3MediaStorage(AppProperties.S3 cfg) {
        var creds = StaticCredentialsProvider.create(AwsBasicCredentials.create(cfg.accessKey(), cfg.secretKey()));
        var region = Region.of(cfg.region() == null || cfg.region().isBlank() ? "us-east-1" : cfg.region());
        var pathStyle = S3Configuration.builder().pathStyleAccessEnabled(true).build();
        this.client = S3Client.builder().endpointOverride(URI.create(cfg.endpoint())).credentialsProvider(creds)
                .region(region).serviceConfiguration(pathStyle).build();
        String pub = cfg.publicEndpoint() == null || cfg.publicEndpoint().isBlank() ? cfg.endpoint() : cfg.publicEndpoint();
        this.presigner = S3Presigner.builder().endpointOverride(URI.create(pub)).credentialsProvider(creds)
                .region(region).serviceConfiguration(pathStyle).build();
        this.bucket = cfg.bucket();
    }

    @Override
    public void put(String key, InputStream in, long size, String contentType) throws IOException {
        client.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
                RequestBody.fromInputStream(in, size));
    }

    @Override
    public void delete(String key) {
        client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    @Override
    public String url(String key, Duration ttl) {
        return presigner.presignGetObject(GetObjectPresignRequest.builder().signatureDuration(ttl)
                .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key).build()).build()).url().toString();
    }
}
