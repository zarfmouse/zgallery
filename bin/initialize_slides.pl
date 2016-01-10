#!/usr/bin/perl

use strict;
use warnings;

use FindBin qw($RealBin);

use JSON qw(decode_json encode_json);
use Storable qw(lock_store lock_retrieve);
use Data::Dumper qw(Dumper);
use IO::File;
use File::Basename qw(basename dirname);
use File::Copy qw(copy);

use Getopt::Long qw(GetOptions);
my $help = 0;
my $VERBOSE = 0;
my $pass;
my $credit;
my $title;
my $skip_mogrify = 0;
my $author_subs = 0;
my $DRY_RUN = 0;
my $slug = 'Image';
GetOptions(
    "help" => \$help,
    "verbose" => \$VERBOSE,
    "dry-run" => \$DRY_RUN,
    "pass=s" => \$pass,
    "credit=s" => \$credit,
    "title=s" => \$title,
    "skip-mogrify" => $skip_mogrify,
    "author-subs" => \$author_subs,
    );

my $Usage = <<"USAGE";
$0 [--help]
$0 [--verbose] [--dry-run] [--pass=FILENAME] [--title=TITLE] [--credit=CREDIT --slug=STR | --author-subs] [--skip-mogrify] [--pass=FILENAME];
USAGE
    ;

$help and die $Usage;

my @pass_ids;
if(defined($pass)) {
    -f $pass or die "$pass not found";
    @pass_ids = map {chomp; $_;} IO::File->new($pass)->getlines();
}

my $image_dir = "$RealBin/../images";
-d $image_dir or die "$image_dir not found.";
chdir($image_dir) or die "chdir($image_dir): $!";
my $orig_dir = "$image_dir/orig";
-d $orig_dir or die "$orig_dir not found";
my $thumb_dir = "$image_dir/thumbs";
-d $thumb_dir or $DRY_RUN or mkdir($thumb_dir, 0755) or die "mkdir($thumb_dir): $!";

my $slides_file = "$image_dir/slides.storable";
my $slides = { slides => [] };
if(defined($title)) {
    $slides->{title} = $title;
}



my @files;
if($author_subs) {
    @files = glob("orig/*/*.[Jj][Pp]*[gG]");
} else {
    @files = glob("orig/*.[Jj][Pp]*[gG]");
}

my $i = 0;
my $previous_dir = ''; 
foreach my $image (@files) {
    my $filename = basename($image);
    print "$image...\n";
    
    if($author_subs) {
	$credit = basename(dirname($image));
	$credit =~ s/^[0-9]+_//;
	$slug = $credit;
	if($credit ne $previous_dir) {
	    $previous_dir = $credit;
	    $i=0;
	}
	$credit =~ s/_/ /g;
    }
    $i++;
    my $target_filename = "$slug-".sprintf("%04i", $i).".jpg";

    my $thumb_file = "$thumb_dir/tn_$target_filename";
    my $image_file = "$image_dir/$target_filename";
    unless($skip_mogrify) {
	$DRY_RUN or copy($image, $image_file) or die "copy($image, $image_file): $!";
	my $image_cmd = "mogrify -geometry 1500x1500 '$image_file'";
	print "\t$image_cmd\n" if $VERBOSE;
	$DRY_RUN or system($image_cmd);

	$DRY_RUN or copy($image, $thumb_file) or die "copy($image, $thumb_file): $!";
	my $thumb_cmd = "mogrify -geometry 200x200^ -gravity Center -crop 200x150+0+0 +repage '$thumb_file'";
	print "\t$thumb_cmd\n" if $VERBOSE;
	$DRY_RUN or system($thumb_cmd);
    } else {
	-f $image_file or die "$image_file is missing";
	-f $thumb_file or die "$thumb_file is missing";
    }

    my $slide = {
	image => "images/$target_filename",
	thumb => "images/thumbs/tn_$target_filename",
	orig => $image,
	active => 1,
    };
    push(@{$slides->{slides}}, $slide);
    if(defined($pass)) {
	$slide->{pass_id} = shift @pass_ids;
	print "\t$slide->{pass_id}\n" if $VERBOSE;
    }
    if(defined($credit)) {
	$slide->{title} = "Credit: $credit";
    }
}
$DRY_RUN or lock_store($slides => $slides_file);
print Dumper($slides);
__END__



