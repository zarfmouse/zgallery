# zgallery
A very simple image gallery.

## Check out the code and dependencies

```
cd $DOCROOT
git clone git@github.com:zarfmouse/zgallery.git photos
cd photos
git clone https://github.com/buildinternet/supersized.git
cd pick
git clone https://github.com/janl/mustache.js.git
git clone https://github.com/aehlke/tag-it.git
cd ../bin
git clone https://github.com/zarfmouse/zcme-lib-perl.git
```

## Secure the REST endpoint

```
cd $DOCROOT/photos
bin/set_password.pl
```

## Initialize the images directory.

Images are organized into collections which are in subdirectories of
the "images" directory.

```
cd $DOCROOT/photos
mkdir -p images/$COLLECTION/orig
cp $SOURCE_IMAGES/* images/$COLLECTION/orig/
bin/initialize_slides.pl --verbose --colletion="$COLLECTION" --credit="John Doe" --title="A Title" 
```

### Use the picker

You can select which images are active and add tags at the picker. 

http://YOURDOMAIN/photos/pick/COLLECTION

### View the slideshow

Images from COLLECTION
http://YOURDOMAIN/photos/COLLECTION

Images with TAG1
http://YOURDOMAIN/photos/COLLECTION/TAG1

Images with both TAG1 and TAG2
http://YOURDOMAIN/photos/COLLECTION/TAG1/TAG2

Images from COLLECTION with TAG1 in random order: 
http://YOURDOMAIN/photos/COLLECTION/TAG1?random=1

## Examples

http://wedding.ember.us/photos/gopho
