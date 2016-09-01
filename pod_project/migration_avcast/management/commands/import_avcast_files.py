# -*- coding: utf-8 -*-

"""
Import files
"""

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from pods.models import Pod
import os


class Command(BaseCommand):
    help = "Import all avcast's files in pod"

    def add_arguments(self, parser):
        parser.add_argument('begin', nargs='?', type=int, default=1)
        parser.add_argument('end', nargs='?', type=int, default=2147483647)

    def avcast_get_media_folder(self, courseid, volume_path):
        idformat = "%08d" % courseid
        if len(idformat) <= 8:
            mediafolder = os.path.join(volume_path, idformat[0:2],
                idformat[2:4], idformat[4:6], idformat[6:8])
        else:
            mediafolder = os.path.join(volume_path, courseid)
        return mediafolder

    def handle(self, *args, **options):
        # TODO work in progress
        begin = options['begin']
        end = options['end']
        # Check settings
        if not hasattr(settings, 'AVCAST_VOLUME_PATH') or not settings.AVCAST_VOLUME_PATH:
            raise CommandError("AVCAST_VOLUME_PATH must be setted")
        if not hasattr(settings, 'AVCAST_FAKE_FILES_COPY') or not settings.AVCAST_FAKE_FILES_COPY:
            raise CommandError("AVCAST_FAKE_FILES_COPY must be setted")

        try:
            self.stdout.write("Import all files ...")
            # Get imported Pods form avcast
            list_pods = Pod.objects.filter(
                encoding_status="AVCAST",
                id__gte=begin,
                id__lte=end)

            # TODO mv files from EncodingPods
            for pod in list_pods:
                self.stdout.write("Processing %s" % pod)
                for encodingpod in pod.encodingpods_set.all():
                    filename = os.path.basename(encodingpod.encodingFile.name)
                    mediafolder = self.avcast_get_media_folder(
                        pod.id, settings.AVCAST_VOLUME_PATH)
                    origin = os.path.join(mediafolder, filename)
                    destination = encodingpod.encodingFile.path
                    self.stdout.write("From %s to %s" % (origin, destination))

                    # on affiche un warning si le fichier origin n'existe pas et on continue la boucle
                    if not os.path.isfile(origin):
                        self.stdout.write("Warning ! The file %s doesn't exist !" % origin)
                        continue
                    else:
                        if settings.AVCAST_FAKE_FILES_COPY:
                            self.stdout.write("Fake : Copy %s to %s".format(origin, destination))
                        else:
                            # TODO create destination folder
                            # TODO copy the file
                            pass

            # TODO mv files from DocPods
            # TODO mv files from TrackPods ???

        except:
            raise CommandError("An error occurs")
        finally:
            self.stdout.write("Done !")
