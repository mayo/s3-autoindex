Static website to generate directory listing for S3 buckets.

## Usage
Clone the repository and edit [src/js/config.js](https://github.com/mayo/s3-autoindex/blob/master/src/js/config.js), configuring it with your bucket's REST endpoint hostname.

**Note:** The S3 REST endpoint used differs from S3's website endpoint. For more details, see: [Website Rest EndpointDiff](http://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteEndpoints.html#WebsiteRestEndpointDiff).

#### S3 Bucket Permissions
You must setup the S3 website bucket to allow public read access.

* Grant `Everyone` the `List` and `View` permissions

* Assign the following CORS Configuration:
```
<CORSConfiguration>
 <CORSRule>
   <AllowedOrigin>*</AllowedOrigin>
   <AllowedMethod>GET</AllowedMethod>
   <AllowedHeader>*</AllowedHeader>
 </CORSRule>
</CORSConfiguration>
```
