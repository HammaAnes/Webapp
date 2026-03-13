import { Mail, Phone, Building2, Eye } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { CONTACT_SOURCES, CONTACT_SOURCE_COLORS, CONTACT_STATUTS, CONTACT_STATUT_COLORS } from '../../constants/contacts';
import type { Contact } from '../../types';

interface ContactCardProps {
  contact: Contact & {
    nbReservations?: number;
    nbDomiciliations?: number;
    user?: {
      nom: string;
      prenom: string;
      email: string;
    } | null;
  };
  onView: (id: string) => void;
}

export function ContactCard({ contact, onView }: ContactCardProps) {
  return (
    <tr className="border-b border-border hover:bg-secondary/50 transition-colors">
      <td className="py-4 px-4">
        <div>
          <div className="font-medium text-primary">
            {contact.prenom} {contact.nom}
          </div>
          {contact.user && (
            <div className="text-xs text-green-600 mt-1 font-medium">
              Compte créé
            </div>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="space-y-1">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.telephone && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{contact.telephone}</span>
            </div>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        {contact.entreprise && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{contact.entreprise}</span>
          </div>
        )}
      </td>
      <td className="py-4 px-4">
        <Badge className={CONTACT_SOURCE_COLORS[contact.source]}>
          {CONTACT_SOURCES[contact.source]}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <Badge className={CONTACT_STATUT_COLORS[contact.statut]}>
          {CONTACT_STATUTS[contact.statut]}
        </Badge>
      </td>
      <td className="py-4 px-4 text-sm text-muted">
        <div>{contact.nbReservations || 0} rés.</div>
        <div>{contact.nbDomiciliations || 0} dom.</div>
      </td>
      <td className="py-4 px-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(contact.id)}
          className="hover:bg-accent/10"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}
